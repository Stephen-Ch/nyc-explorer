(function () {
  // Ensure window.App exists and hydrate config from window.ENV.
  const app = window.App = window.App || {};
  if (!app.config || typeof app.config !== 'object') {
    const envConfig = typeof window.ENV === 'object' && window.ENV !== null ? window.ENV : {};
    app.config = envConfig;
  }
})();
