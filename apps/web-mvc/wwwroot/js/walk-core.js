(function () {
  const R = 6371008.8;
  const NEAR_METRES = 50;
  const TIE_METRES = 1;
  const EPSILON = 1e-9;

  const toRadians = (value) => value * Math.PI / 180;
  const toDegrees = (value) => value * 180 / Math.PI;

  const keyForPair = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  const projectFactory = (lat0) => {
    const cosLat0 = Math.cos(toRadians(lat0 || 0));
    return {
      toXY(lat, lng) {
        return {
          x: toRadians(lng) * R * cosLat0,
          y: toRadians(lat) * R,
        };
      },
      toLatLng(x, y) {
        return {
          lat: toDegrees(y / R),
          lng: toDegrees(x / (R * cosLat0)),
        };
      },
    };
  };

  const nearestPointOnSegment = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const denom = dx * dx + dy * dy;
    if (denom <= EPSILON) {
      const ddx = px - ax;
      const ddy = py - ay;
      return {
        t: 0,
        x: ax,
        y: ay,
        metres: Math.hypot(ddx, ddy),
      };
    }

    const tRaw = ((px - ax) * dx + (py - ay) * dy) / denom;
    const t = Math.min(1, Math.max(0, tRaw));
    const x = ax + t * dx;
    const y = ay + t * dy;
    return {
      t,
      x,
      y,
      metres: Math.hypot(px - x, py - y),
    };
  };

  const nearestOnPolyline = (lineXY, pointXY) => {
    if (!lineXY.length) {
      return { metres: Infinity, along: 0 };
    }
    if (lineXY.length === 1) {
      return {
        metres: Math.hypot(pointXY.x - lineXY[0].x, pointXY.y - lineXY[0].y),
        along: 0,
      };
    }

    let best = { metres: Infinity, along: 0 };
    let walked = 0;
    for (let i = 0; i < lineXY.length - 1; i += 1) {
      const a = lineXY[i];
      const b = lineXY[i + 1];
      const nearest = nearestPointOnSegment(pointXY.x, pointXY.y, a.x, a.y, b.x, b.y);
      const segmentLength = Math.hypot(b.x - a.x, b.y - a.y);
      const along = walked + nearest.t * segmentLength;
      if (nearest.metres < best.metres - EPSILON) {
        best = { metres: nearest.metres, along };
      }
      walked += segmentLength;
    }
    return best;
  };

  const polylineLength = (lineXY) => {
    let total = 0;
    for (let i = 0; i < lineXY.length - 1; i += 1) {
      total += Math.hypot(lineXY[i + 1].x - lineXY[i].x, lineXY[i + 1].y - lineXY[i].y);
    }
    return total;
  };

  const prepareGraph = (json) => {
    const rawNodes = Array.isArray(json && json.nodes) ? json.nodes : [];
    const rawEdges = Array.isArray(json && json.edges) ? json.edges : [];
    const lat0 = rawNodes.length
      ? rawNodes.reduce((sum, node) => sum + Number(node[1]), 0) / rawNodes.length
      : 0;
    const projector = projectFactory(lat0);

    const nodeMap = new Map();
    rawNodes.forEach((node) => {
      if (!Array.isArray(node) || node.length < 3) {
        return;
      }
      const id = Number(node[0]);
      const lat = Number(node[1]);
      const lng = Number(node[2]);
      if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }
      const xy = projector.toXY(lat, lng);
      nodeMap.set(id, { id, lat, lng, x: xy.x, y: xy.y });
    });

    const edges = [];
    const edgeMetresByKey = new Map();
    const adjacency = new Map();
    nodeMap.forEach((_, id) => {
      adjacency.set(id, []);
    });

    rawEdges.forEach((edge) => {
      if (!Array.isArray(edge) || edge.length < 3) {
        return;
      }
      const a = Number(edge[0]);
      const b = Number(edge[1]);
      const metres = Number(edge[2]);
      const nodeA = nodeMap.get(a);
      const nodeB = nodeMap.get(b);
      if (!nodeA || !nodeB || !Number.isFinite(metres) || metres < 0) {
        return;
      }
      const edgeIndex = edges.length;
      const entry = { a, b, metres, ax: nodeA.x, ay: nodeA.y, bx: nodeB.x, by: nodeB.y };
      edges.push(entry);
      edgeMetresByKey.set(keyForPair(a, b), metres);
      adjacency.get(a).push({ to: b, metres, edgeIndex });
      adjacency.get(b).push({ to: a, metres, edgeIndex });
    });

    return {
      lat0,
      projector,
      nodeMap,
      edges,
      edgeMetresByKey,
      adjacency,
    };
  };

  const snap = (graph, lat, lng) => {
    const pointXY = graph.projector.toXY(lat, lng);
    let best = null;
    graph.edges.forEach((edge) => {
      const nearest = nearestPointOnSegment(
        pointXY.x,
        pointXY.y,
        edge.ax,
        edge.ay,
        edge.bx,
        edge.by,
      );
      if (!best || nearest.metres < best.metres - EPSILON) {
        best = {
          a: edge.a,
          b: edge.b,
          t: nearest.t,
          x: nearest.x,
          y: nearest.y,
          metres: nearest.metres,
        };
      }
    });

    if (!best) {
      throw new Error('Graph has no usable edges');
    }

    const latLng = graph.projector.toLatLng(best.x, best.y);
    return {
      a: best.a,
      b: best.b,
      t: best.t,
      lat: latLng.lat,
      lng: latLng.lng,
      metres: best.metres,
    };
  };

  const dijkstra = (graph, sourceCosts) => {
    const dist = new Map();
    const prev = new Map();
    const queue = [];

    sourceCosts.forEach((cost, nodeId) => {
      dist.set(nodeId, cost);
      queue.push({ nodeId, cost });
    });

    while (queue.length) {
      let bestIndex = 0;
      for (let i = 1; i < queue.length; i += 1) {
        if (queue[i].cost < queue[bestIndex].cost) {
          bestIndex = i;
        }
      }
      const current = queue.splice(bestIndex, 1)[0];
      const known = dist.get(current.nodeId);
      if (known === undefined || current.cost > known + EPSILON) {
        continue;
      }
      const neighbors = graph.adjacency.get(current.nodeId) || [];
      neighbors.forEach((neighbor) => {
        const nextCost = current.cost + neighbor.metres;
        const oldCost = dist.get(neighbor.to);
        if (oldCost === undefined || nextCost < oldCost - EPSILON) {
          dist.set(neighbor.to, nextCost);
          prev.set(neighbor.to, current.nodeId);
          queue.push({ nodeId: neighbor.to, cost: nextCost });
        }
      });
    }

    return { dist, prev };
  };

  const buildNodePath = (prev, start, end) => {
    const out = [end];
    let cursor = end;
    while (cursor !== start) {
      if (!prev.has(cursor)) {
        return null;
      }
      cursor = prev.get(cursor);
      out.push(cursor);
    }
    out.reverse();
    return out;
  };

  const buildNodePathFromEnd = (prev, end) => {
    const out = [end];
    let cursor = end;
    while (prev.has(cursor)) {
      cursor = prev.get(cursor);
      out.push(cursor);
    }
    out.reverse();
    return out;
  };

  const planWalk = (graph, groups, fromId, toId, nearMetres = NEAR_METRES) => {
    const groupList = Array.isArray(groups) ? groups : [];
    const groupById = new Map(groupList.map((group) => [group.id, group]));
    const fromGroup = groupById.get(fromId);
    const toGroup = groupById.get(toId);

    if (!fromGroup || !toGroup) {
      return { ok: false, reason: 'unknown-place' };
    }
    if (fromId === toId) {
      return { ok: false, reason: 'same-place' };
    }
    if (!graph || !Array.isArray(graph.edges) || !graph.edges.length) {
      return { ok: false, reason: 'no-walk' };
    }

    const fromSnap = snap(graph, fromGroup.lat, fromGroup.lng);
    const toSnap = snap(graph, toGroup.lat, toGroup.lng);

    const fromEdgeMetres = graph.edgeMetresByKey.get(keyForPair(fromSnap.a, fromSnap.b));
    const toEdgeMetres = graph.edgeMetresByKey.get(keyForPair(toSnap.a, toSnap.b));
    if (!Number.isFinite(fromEdgeMetres) || !Number.isFinite(toEdgeMetres)) {
      return { ok: false, reason: 'no-walk' };
    }

    const sourceCosts = new Map();
    sourceCosts.set(fromSnap.a, fromSnap.t * fromEdgeMetres);
    sourceCosts.set(fromSnap.b, (1 - fromSnap.t) * fromEdgeMetres);
    const { dist, prev } = dijkstra(graph, sourceCosts);

    let bestGraph = null;
    const candidates = [
      { end: toSnap.a, extra: toSnap.t * toEdgeMetres },
      { end: toSnap.b, extra: (1 - toSnap.t) * toEdgeMetres },
    ];
    candidates.forEach((candidate) => {
      const d = dist.get(candidate.end);
      if (!Number.isFinite(d)) {
        return;
      }
      const total = d + candidate.extra;
      if (!bestGraph || total < bestGraph.metres - EPSILON) {
        bestGraph = { end: candidate.end, metres: total };
      }
    });

    let bestDirect = null;
    if (keyForPair(fromSnap.a, fromSnap.b) === keyForPair(toSnap.a, toSnap.b)) {
      const edgeMetres = graph.edgeMetresByKey.get(keyForPair(fromSnap.a, fromSnap.b));
      if (Number.isFinite(edgeMetres)) {
        bestDirect = Math.abs(fromSnap.t - toSnap.t) * edgeMetres;
      }
    }

    let chosenLine = null;
    let chosenMetres = null;
    if (
      Number.isFinite(bestDirect)
      && (!bestGraph || bestDirect <= bestGraph.metres + EPSILON)
    ) {
      chosenLine = [
        [fromSnap.lat, fromSnap.lng],
        [toSnap.lat, toSnap.lng],
      ];
      chosenMetres = bestDirect;
    } else if (bestGraph) {
      const pathNodes = buildNodePathFromEnd(prev, bestGraph.end);
      chosenLine = [[fromSnap.lat, fromSnap.lng]];
      pathNodes.forEach((nodeId) => {
        const node = graph.nodeMap.get(nodeId);
        if (node) {
          chosenLine.push([node.lat, node.lng]);
        }
      });
      chosenLine.push([toSnap.lat, toSnap.lng]);
      chosenMetres = bestGraph.metres;
    } else {
      return { ok: false, reason: 'no-walk' };
    }

    const lineXY = chosenLine.map(([lat, lng]) => graph.projector.toXY(lat, lng));
    const totalLineLength = polylineLength(lineXY);

    const middle = [];
    groupList.forEach((group) => {
      if (!group || typeof group.id !== 'string') {
        return;
      }
      if (group.id === fromId || group.id === toId) {
        return;
      }
      const nearest = nearestOnPolyline(lineXY, graph.projector.toXY(group.lat, group.lng));
      if (nearest.metres <= nearMetres + EPSILON) {
        middle.push({
          id: group.id,
          name: group.name,
          count: Array.isArray(group.stories) ? group.stories.length : 0,
          metres: nearest.metres,
          along: nearest.along,
        });
      }
    });

    middle.sort((a, b) => a.along - b.along);
    const tieSorted = [];
    for (let i = 0; i < middle.length; ) {
      const baseAlong = middle[i].along;
      const run = [middle[i]];
      i += 1;
      while (i < middle.length && middle[i].along <= baseAlong + TIE_METRES + EPSILON) {
        run.push(middle[i]);
        i += 1;
      }
      run.sort((a, b) => {
        const da = Math.round(a.metres);
        const db = Math.round(b.metres);
        if (da !== db) {
          return da - db;
        }
        return (a.name || '').localeCompare(b.name || '');
      });
      tieSorted.push(...run);
    }

    const list = [
      {
        id: fromGroup.id,
        name: fromGroup.name,
        count: Array.isArray(fromGroup.stories) ? fromGroup.stories.length : 0,
        metres: fromSnap.metres,
        along: 0,
      },
      ...tieSorted,
      {
        id: toGroup.id,
        name: toGroup.name,
        count: Array.isArray(toGroup.stories) ? toGroup.stories.length : 0,
        metres: toSnap.metres,
        along: totalLineLength,
      },
    ];

    return {
      ok: true,
      line: chosenLine,
      metres: chosenMetres,
      list,
    };
  };

  const api = {
    NEAR_METRES,
    TIE_METRES,
    prepareGraph,
    snap,
    planWalk,
  };

  if (typeof window !== 'undefined') {
    window.WalkCore = api;
  }
  if (typeof module !== 'undefined') {
    module.exports = api;
  }
})();
