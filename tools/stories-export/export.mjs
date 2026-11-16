#!/usr/bin/env node
// Plan 41 step 3 CLI. Usage:
// node export.mjs --story-list <txt> --stories <csv> --story-text <csv> --points <csv> --latlon <csv> --era-names <csv> --out <json>
import fs from 'node:fs';
import { exportStories } from './lib.mjs';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
for (const k of ['story-list', 'stories', 'story-text', 'points', 'latlon', 'era-names', 'out'])
  if (!args[k]) { console.error(`missing --${k}`); process.exit(2); }

const r = exportStories({ storyList: args['story-list'], storiesCsv: args.stories, storyTextCsv: args['story-text'],
  pointsCsv: args.points, latlonCsv: args.latlon, eraNamesCsv: args['era-names'] });

const data = { version: r.version, era: r.era,
  attribution: 'Map positions use OpenStreetMap data, (c) OpenStreetMap contributors (ODbL).', groups: r.groups };
fs.writeFileSync(args.out, JSON.stringify(data, null, 2) + '\n');

const n = r.groups.reduce((a, g) => a + g.stories.length, 0);
console.log(`era ${r.era}: ${n} stories on ${r.groups.length} points -> ${args.out}`);
console.log(`names replaced (era names file): ${r.namesReplaced}`);
console.log(`dropped: ${r.dropped.length}`);
for (const d of r.dropped) console.log(`  ${d.id}: ${d.reason}`);
console.log(`links dropped: ${r.linksDropped.length}`);
for (const d of r.linksDropped) console.log(`  ${d.id}: ${d.link}`);
