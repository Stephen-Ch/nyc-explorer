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

  /**
   * toPointsFromPolyline(poly)
   * Accepts provider polyline (string) and returns Array<[lat,lng]>.
   * Placeholder: returns [] for non-string or 'enc:'-prefixed dummy data.
   */
  NS.toPointsFromPolyline = function(poly){
    if (typeof poly !== 'string' || !poly.length) return [];
    if (poly.startsWith('enc:')) return []; // decoder to be added later
    return [];
  };

  /**
   * buildSvgPath(points)
   * Converts Array<[lat,lng]> into a simple SVG path string: "M lat lng L lat lng …"
   */
  NS.buildSvgPath = function(points){
    const arr = Array.isArray(points) ? points : [];
    if (!arr.length) return '';
    return arr.map((p, i) => (i === 0 ? 'M ' : 'L ') + (p[0]||0) + ' ' + (p[1]||0)).join(' ');
  };
})();

