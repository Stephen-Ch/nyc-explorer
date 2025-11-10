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
   * Routes through decodePolyline for 'enc:'-prefixed data.
   */
  NS.toPointsFromPolyline = function(poly){
    if (typeof poly !== 'string' || !poly.length) return [];
    if (poly.startsWith('enc:')) return NS.decodePolyline(poly);
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

  /**
   * decodePolyline(poly)
   * Minimal stub: returns a fixed path for our known dummy token; else [].
   * @param {string} poly
   * @returns {Array<[number,number]>}
   */
  NS.decodePolyline = function(poly){
    if (typeof poly !== 'string') return [];
    if (poly === 'enc:abc123_dummy_polyline') {
      return [
        [40.74105, -73.98970],
        [40.74840, -73.98570],
        [40.75800, -73.98550]
      ];
    }
    return [];
  };

  /**
   * renderSvgPolyline(containerSelector, points)
   * Creates <svg data-testid="overlay-polyline"><path d="..."></path></svg> in container (or body).
   * Returns { d, count } where d is the built path string.
   */
  NS.renderSvgPolyline = function(containerSelector, points){
    var target = document.querySelector(containerSelector) || document.body;
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('data-testid', 'overlay-polyline');
    var path = document.createElementNS(svgNS, 'path');
    var d = NS.buildSvgPath(points || []);
    path.setAttribute('d', d);
    svg.appendChild(path);
    target.appendChild(svg);
    return { d: d, count: Array.isArray(points) ? points.length : 0 };
  };

  /**
   * renderPolylineOrError(containerSelector, response)
   * If response.polyline exists → decode & render SVG.
   * Else → append <div data-testid="overlay-error">No polyline</div>.
   * Returns { status: 'ok'|'error', count?: number, d?: string, reason?: string }
   */
  NS.renderPolylineOrError = function(containerSelector, response){
    var target = document.querySelector(containerSelector) || document.body;
    if (!response || typeof response !== 'object') {
      return { status: 'error', reason: 'invalid-response' };
    }
    if (typeof response.polyline === 'string' && response.polyline.length) {
      var pts = NS.toPointsFromPolyline(response.polyline);
      var res = NS.renderSvgPolyline(containerSelector, pts);
      return { status: 'ok', count: res.count, d: res.d || '' };
    }
    var div = document.createElement('div');
    div.setAttribute('data-testid', 'overlay-error');
    div.textContent = 'No polyline';
    target.appendChild(div);
    return { status: 'error', reason: 'missing-polyline' };
  };
})();

