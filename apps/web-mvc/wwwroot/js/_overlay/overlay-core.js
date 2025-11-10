/* Overlay Core (UNUSED stub; freeze ON) */
/* selectors v0.7; do not import/wire */
(function(){
  'use strict';
  const NS = (window.NYCOverlayCore = window.NYCOverlayCore || {});
  NS.buildPolyline = function(points){
    if (!Array.isArray(points)) return { path: [], len: 0 };
    const path = points.map(p => [Number(p.lat)||0, Number(p.lng)||0]);
    return { path, len: path.length };
  };
  NS.normalizeStep = function(step){
    return { i: Number(step?.i)||0, text: String(step?.instruction||'') };
  };
})();
