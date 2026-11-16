'use strict';
// Plan 41 slice 1b step 1: writes content/walk-graph.v1.json.
// Usage: node tools/walk-graph/build.js <osm-streets.json> <osm-download-date.txt> <stories.v1.json> <out.json>
const fs = require('fs');
const lib = require('./lib.js');

const [osmPath, datePath, storiesPath, outPath] = process.argv.slice(2);
if (!osmPath || !datePath || !storiesPath || !outPath) {
  console.error('Usage: node tools/walk-graph/build.js <osm-streets.json> <osm-download-date.txt> <stories.v1.json> <out.json>');
  process.exit(2);
}

const osm = JSON.parse(fs.readFileSync(osmPath, 'utf8'));
const downloadDate = fs.readFileSync(datePath, 'utf8').trim();
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
const graph = lib.buildGraph(osm, { box: lib.DEFAULT_BOX });
const { rows, worst } = lib.checkPlaces(graph, stories.groups, 150);

fs.writeFileSync(outPath, `${JSON.stringify(lib.toOutput(graph, downloadDate))}\n`);
console.log(`nodes ${graph.nodes.length}, edges ${graph.edges.length}`);
console.log(`dropped pieces ${graph.dropped.pieces} (${graph.dropped.nodes} nodes)`);
console.log(`places ${rows.length}, worst ${worst.id} ${Math.round(worst.m)} m`);
for (const r of rows.sort((a, b) => b.m - a.m)) console.log(`  ${Math.round(r.m)} m  ${r.id}`);
