/* Overlay Announce (UNUSED stub; freeze ON) */
(function(){
  'use strict';
  const NS = (window.NYCOverlayAnnounce = window.NYCOverlayAnnounce || {});
  NS.ariaAnnounce = function(text){
    const s = String(text||'').trim();
    return s ? 'announce:'+s : '';
  };
})();
