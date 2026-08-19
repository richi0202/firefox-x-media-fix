// ==UserScript==
// @name         Firefox X Media Fix
// @namespace    https://github.com/richi0202/firefox-x-media-fix
// @version      1.0.1
// @description  Repairs X/Twitter media wrappers that collapse to near-zero width in Firefox.
// @author       richi0202
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (!/Firefox\//.test(navigator.userAgent)) return;

  const MAX_COLLAPSED_WIDTH = 10;
  const MIN_PARENT_WIDTH = 100;
  const MIN_MEDIA_HEIGHT = 80;

  const WRAPPER_SELECTOR =
    'div[data-testid="ScrollSnap-List"] > div[role="presentation"]';

  const MEDIA_SELECTOR = '[data-testid="tweetPhoto"], video, img';

  let scheduled = false;

  function isCollapsed(wrapper) {
    if (!wrapper || !wrapper.parentElement) return false;

    const rect = wrapper.getBoundingClientRect();
    const parentRect = wrapper.parentElement.getBoundingClientRect();

    return (
      rect.width < MAX_COLLAPSED_WIDTH &&
      rect.height >= MIN_MEDIA_HEIGHT &&
      parentRect.width > MIN_PARENT_WIDTH
    );
  }

  function containsMedia(wrapper) {
    return Boolean(wrapper.querySelector(MEDIA_SELECTOR));
  }

  function repairWrapper(wrapper) {
    if (!containsMedia(wrapper) || !isCollapsed(wrapper)) return false;

    wrapper.style.setProperty('width', '100%', 'important');
    wrapper.style.setProperty('min-width', '100%', 'important');
    wrapper.style.setProperty('flex-basis', '100%', 'important');
    wrapper.dataset.firefoxXMediaFixed = '1';

    return true;
  }

  function scan() {
    for (const wrapper of document.querySelectorAll(WRAPPER_SELECTOR)) {
      repairWrapper(wrapper);
    }
  }

  function scheduleScan() {
    if (scheduled) return;

    scheduled = true;

    setTimeout(() => {
      scheduled = false;
      scan();
    }, 50);
  }

  const observer = new MutationObserver(scheduleScan);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  scan();

  // X can finish sizing media after initial insertion.
  setTimeout(scan, 250);
  setTimeout(scan, 750);
  setTimeout(scan, 1500);
})();
