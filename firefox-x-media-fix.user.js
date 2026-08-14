// ==UserScript==
// @name         Firefox X Media Fix
// @namespace    https://github.com/richi0202/firefox-x-media-fix
// @version      1.0.0
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

  const MEDIA_URL_FRAGMENT = 'pbs.twimg.com/media';
  const MAX_COLLAPSED_WIDTH = 10;
  const MIN_PARENT_WIDTH = 100;
  const MIN_MEDIA_HEIGHT = 80;

  function hasMediaBackground(el) {
    try {
      return getComputedStyle(el).backgroundImage.includes(MEDIA_URL_FRAGMENT);
    } catch {
      return false;
    }
  }

  function findCollapsedWrapper(media) {
    let current = media;

    while (current && current.parentElement) {
      const rect = current.getBoundingClientRect();
      const parentRect = current.parentElement.getBoundingClientRect();

      if (
        rect.width < MAX_COLLAPSED_WIDTH &&
        rect.height >= MIN_MEDIA_HEIGHT &&
        parentRect.width > MIN_PARENT_WIDTH
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  function repairWrapper(wrapper) {
    if (!wrapper || wrapper.dataset.firefoxXMediaFixed === '1') return false;

    wrapper.style.setProperty('width', '100%', 'important');
    wrapper.style.setProperty('min-width', '100%', 'important');
    wrapper.style.setProperty('flex-basis', '100%', 'important');
    wrapper.dataset.firefoxXMediaFixed = '1';

    return true;
  }

  function repairMedia(media) {
    const wrapper = findCollapsedWrapper(media);
    return repairWrapper(wrapper);
  }

  function scan(root = document) {
    const nodes = [];

    if (root.nodeType === Node.ELEMENT_NODE && hasMediaBackground(root)) {
      nodes.push(root);
    }

    if (root.querySelectorAll) {
      for (const el of root.querySelectorAll('*')) {
        if (hasMediaBackground(el)) nodes.push(el);
      }
    }

    for (const media of nodes) repairMedia(media);
  }

  let scheduled = false;

  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      scan(document);
    });
  }

  const observer = new MutationObserver(scheduleScan);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  scan(document);

  // X can finish sizing media after initial insertion.
  setTimeout(scheduleScan, 500);
  setTimeout(scheduleScan, 1500);
})();
