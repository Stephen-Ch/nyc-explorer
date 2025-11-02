import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const razor = path.join(root, 'apps', 'web-mvc', 'Views', 'Poi', 'Detail.cshtml');
const successPattern = /Hot reload (?:of changes )?(applied|succeeded)/i;
const spanTemplate = (stamp: number) =>
  `<span class="dev-probe" aria-hidden="true" data-probe="${stamp}"></span>`;
const revertDelayMs = 1_500;
const preTouchDelayMs = 2_000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  let original = await fs.readFile(razor, 'utf8');
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  if (original.endsWith('`r`n')) {
    original = original.replace(/`r`n\s*$/, '') + newline;
    await fs.writeFile(razor, original);
  }

  const child = spawn(
    'dotnet',
    ['watch', '--project', 'apps/web-mvc', 'run', '--urls', 'http://localhost:5101'],
    { cwd: root }
  );
  child.stdout?.setEncoding('utf8');
  child.stderr?.setEncoding('utf8');

  let finished = false;
  let touched = false;
  let touchInFlight = false;
  let revertReadyAt = 0;
  const recentLines: string[] = [];
  let successBuffer = '';

  const appendRecent = (chunk: string) => {
    for (const line of chunk.split(/\r?\n/)) {
      if (!line) continue;
      recentLines.push(line);
      if (recentLines.length > 20) recentLines.shift();
    }
  };

  const finish = async (code: number, reason?: string) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    child.stdout?.removeAllListeners();
    child.stderr?.removeAllListeners();
    child.removeAllListeners();
    if (reason && code !== 0) {
      console.error(reason);
      if (recentLines.length) {
        console.error('Watcher output:\n' + recentLines.join('\n'));
      }
    }
    try {
      if (touched) {
        const waitMs = revertReadyAt - Date.now();
        if (waitMs > 0) {
          await wait(waitMs);
        }
        await fs.writeFile(razor, original);
      }
    } catch (err) {
      console.error('Failed to reset Razor file', err);
    }
    if (!child.killed) {
      child.kill();
      setTimeout(() => child.kill('SIGKILL'), 500).unref();
    }
    if (code === 0) {
      console.log('✅ dotnet watch hot reload confirmed');
    }
    process.exit(code);
  };

  const timeout = setTimeout(
    () => void finish(1, 'Timed out waiting for dotnet watch hot reload signal'),
    20_000
  );

  const triggerTouch = async () => {
    if (touched || touchInFlight) return;
    touchInFlight = true;
    try {
      const stamp = Date.now();
      const span = spanTemplate(stamp);
      const closingH1 = original.indexOf('</h1>');
      let insertPos = -1;
      if (closingH1 !== -1) {
        insertPos = closingH1 + '</h1>'.length;
      } else {
        const bodyIdx = original.indexOf('<body>');
        if (bodyIdx !== -1) {
          insertPos = bodyIdx + '<body>'.length;
        }
      }
      const padding = newline + '  ';
      const edited = insertPos === -1
        ? `${original}${padding}${span}${newline}`
        : `${original.slice(0, insertPos)}${padding}${span}${newline}${original.slice(insertPos)}`;
      await wait(preTouchDelayMs);
      await fs.writeFile(razor, edited);
      const handle = await fs.open(razor, 'r+');
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
      const now = new Date();
      await fs.utimes(razor, now, now);
      touched = true;
      revertReadyAt = Date.now() + revertDelayMs;
    } catch (err) {
      await finish(1, `Failed to touch Razor file: ${err}`);
    } finally {
      touchInFlight = false;
    }
  };

  const handleData = async (data: Buffer, stream: 'stdout' | 'stderr') => {
    const text = data.toString();
    (stream === 'stdout' ? process.stdout : process.stderr).write(text);
    appendRecent(text);
    successBuffer = (successBuffer + text).slice(-500);
    if (text.includes('Content root path')) {
      await triggerTouch();
    }
    if (successPattern.test(successBuffer)) {
      await finish(0);
    }
  };

  child.stdout?.on('data', data => {
    handleData(data, 'stdout').catch(err => finish(1, `Probe error: ${err}`));
  });
  child.stderr?.on('data', data => {
    handleData(data, 'stderr').catch(err => finish(1, `Probe error: ${err}`));
  });

  child.on('exit', code => void finish(code ?? 1, 'dotnet watch exited before probe completed'));
  process.on('SIGINT', () => void finish(130));
  process.on('SIGTERM', () => void finish(143));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
