(function () {
  const app = window.App = window.App || {};
  const geo = app.geo = app.geo || {};
  let statusElement = null;

  geo.registerStatusElement = (element) => {
    if (element instanceof HTMLElement) {
      statusElement = element;
    }
  };

  geo.setStatus = (text, options) => {
    if (!(statusElement instanceof HTMLElement)) {
      return;
    }
    const next = text ?? '';
    if (statusElement.textContent !== next) {
      statusElement.textContent = next;
    }
    if (!options) {
      return;
    }
    if (Object.prototype.hasOwnProperty.call(options, 'busy')) {
      const button = options.button;
      if (button instanceof HTMLElement) {
        const busy = Boolean(options.busy);
        button.disabled = busy;
        if (busy) button.setAttribute('aria-disabled', 'true');
        else button.removeAttribute('aria-disabled');
      }
    }
  };
})();
