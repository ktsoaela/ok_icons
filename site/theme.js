// Loaded synchronously in <head> so the saved theme applies before first paint.
(function () {
  try {
    var saved = localStorage.getItem('ok-icons-theme');
    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  } catch (e) {
    /* storage unavailable (private mode, etc.) — fall back to system preference */
  }
})();
