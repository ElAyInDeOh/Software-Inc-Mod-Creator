/**
 * Runtime environment detection for Software Inc Mod Studio.
 * Loaded synchronously in <head>, BEFORE any AI module scripts.
 *
 * Sets window.LOCAL_BUILD / window.AI_ENABLED and tags <html>
 * with either class 'ai-enabled' (local server build) or
 * 'web-only' (GitHub Pages / file://) so CSS can gate AI UI.
 *
 * Manual override for testing:
 *   ?ai=1  forces AI on (e.g. when serving from a non-localhost hostname)
 *   ?ai=0  forces AI off (e.g. when running local server but want web behavior)
 */
(function () {
  var host = (location.hostname || '').toLowerCase();
  /* AI is only available when served from a loopback host
     (i.e. running `npm start`), because the AI proxy lives in
     server.js at /api/ai/*. Opening index.html via file:// or
     hosting on github.io runs the web-only (no-AI) variant. */
  var isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local');

  var m = (location.search.match(/[?&]ai=([01])/) || [])[1];
  if (m === '1') isLocal = true;
  if (m === '0') isLocal = false;

  window.LOCAL_BUILD = isLocal;
  window.AI_ENABLED = isLocal;

  var de = document.documentElement;
  de.classList.toggle('local-build', isLocal);
  de.classList.toggle('ai-enabled', isLocal);
  de.classList.toggle('web-only', !isLocal);
})();
