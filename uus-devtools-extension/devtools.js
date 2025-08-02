// Create Uus.js panel in Chrome DevTools
chrome.devtools.panels.create(
  "Uus.js",
  "icons/icon-48.png",
  "panel.html",
  function(panel) {
    // Panel created
    console.log('Uus.js DevTools panel created');
  }
);

// Listen for Uus.js apps on the page
chrome.devtools.inspectedWindow.eval(
  `window.__UUS_APP__ !== undefined`,
  function(result, isException) {
    if (!isException && result) {
      // Uus.js app detected
      chrome.devtools.inspectedWindow.eval(
        `console.log('%c🎯 Uus.js app detected!', 'color: #3498db; font-weight: bold;')`
      );
    }
  }
);