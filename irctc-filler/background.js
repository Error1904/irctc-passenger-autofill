/**
 * background.js — IRCTC Passenger Autofill (Service Worker)
 *
 * Kept minimal intentionally.  All storage and fill logic lives in
 * popup.js and content.js respectively.
 *
 * This service worker only handles extension lifecycle events and
 * acts as a relay if needed in future iterations.
 */

'use strict';

// Log install / update events for debugging
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[IRCTC Autofill] Extension installed.');
  } else if (details.reason === 'update') {
    console.log('[IRCTC Autofill] Extension updated to', chrome.runtime.getManifest().version);
  }
});
