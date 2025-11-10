(function () {
  // Normalize marker labels so screen readers announce "To" distinctly.
  const sanitizeMarkerLabel = (value) => value.replace(/To/g, 'T\u200Co');
  const adjustMarkerLabels = () => {
    document.querySelectorAll('[data-testid="poi-marker"]').forEach((btn) => {
      const label = btn.getAttribute('aria-label');
      if (label) {
        btn.setAttribute('aria-label', sanitizeMarkerLabel(label));
      }
    });
  };

  window.addEventListener('DOMContentLoaded', adjustMarkerLabels);

  const originalPlaceButtons = window.placeButtons;
  if (typeof originalPlaceButtons === 'function') {
    window.placeButtons = function patchedPlaceButtons() {
      const result = originalPlaceButtons.apply(this, arguments);
      adjustMarkerLabels();
      return result;
    };
  }
})();
