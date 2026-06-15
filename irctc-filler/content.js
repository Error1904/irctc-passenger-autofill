/**
 * content.js — IRCTC Passenger Autofill (FIXED)
 *
 * Targets the real IRCTC passenger entry page:
 *   https://www.irctc.co.in/nget/booking/psgninput
 *
 * The page uses plain Angular-bound <input> and <select> elements
 * inside repeated passenger rows. We locate rows by the passenger
 * name input, then walk siblings to find age / gender / nationality
 * / berth selects within the same row container.
 */

'use strict';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Angular-compatible value setter ─────────────────────────────────────────
// Plain el.value = x doesn't trigger Angular's change detection.
// We must call the native setter through the prototype and then
// dispatch input + change events.

function setNativeValue(el, value) {
  const proto = el instanceof HTMLSelectElement
    ? window.HTMLSelectElement.prototype
    : window.HTMLInputElement.prototype;

  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

// ── Locate all passenger rows ─────────────────────────────────────────────────
//
// On /nget/booking/psgninput IRCTC renders each passenger as a table row or
// a div block. Every row contains an input for the passenger name with
// placeholder "Name" (or similar). We collect ALL such inputs and treat
// each as the anchor for its row.
//
// Known selectors observed in the live page (June 2025):
//   input with placeholder "Name"   → passenger name
//   input with placeholder "Age"    → passenger age
//   select containing "Male/Female" → gender
//   select containing "India"       → nationality
//   select containing "No Preference" → berth

function findPassengerRows() {
  // Strategy 1: Angular formControlName attributes (works on some builds)
  const byFormControl = document.querySelectorAll('input[formcontrolname="passengerName"]');
  if (byFormControl.length > 0) return Array.from(byFormControl);

  // Strategy 2: placeholder text "Name" inside a table-like structure
  const byPlaceholder = Array.from(document.querySelectorAll('input[placeholder="Name"]'));
  if (byPlaceholder.length > 0) return byPlaceholder;

  // Strategy 3: inputs inside rows of the passenger table
  // IRCTC wraps each pax in a div.psgn-div or tr
  const containers = document.querySelectorAll('div.psgn-div, tr.psgn-cnt, div[class*="psgn"]');
  if (containers.length > 0) {
    return Array.from(containers).map(c => c.querySelector('input[type="text"], input:not([type])'));
  }

  // Strategy 4 (broadest): every text input whose placeholder contains "Name"
  return Array.from(
    document.querySelectorAll('input')
  ).filter(el => /^name$/i.test((el.placeholder || '').trim()));
}

// ── Find a sibling field within the same row container ───────────────────────

function getRowContainer(nameInput) {
  // Walk up until we find a container that holds the whole passenger row.
  // IRCTC uses either a <tr> or a wrapping <div> with multiple fields.
  let el = nameInput.parentElement;
  for (let i = 0; i < 8; i++) {
    if (!el) break;
    // A row container will have at least one select (gender/nationality)
    if (el.querySelectorAll('select').length >= 1) return el;
    el = el.parentElement;
  }
  return nameInput.closest('tr') || nameInput.closest('div');
}

function findInRow(container, testFn) {
  if (!container) return null;
  const inputs   = Array.from(container.querySelectorAll('input, select'));
  return inputs.find(testFn) || null;
}

// ── Gender select: contains "Male" option ─────────────────────────────────────

function findGenderSelect(container) {
  return findInRow(container, el =>
    el.tagName === 'SELECT' &&
    Array.from(el.options).some(o => /^male$/i.test(o.text.trim()))
  );
}

// ── Nationality select: contains "India" option ───────────────────────────────

function findNatSelect(container) {
  return findInRow(container, el =>
    el.tagName === 'SELECT' &&
    Array.from(el.options).some(o => /india/i.test(o.text.trim()))
  );
}

// ── Berth select: contains "No Preference" option ────────────────────────────

function findBerthSelect(container) {
  return findInRow(container, el =>
    el.tagName === 'SELECT' &&
    Array.from(el.options).some(o => /preference/i.test(o.text.trim()))
  );
}

// ── Age input: placeholder "Age" or type="number" ────────────────────────────

function findAgeInput(container) {
  return findInRow(container, el =>
    el.tagName === 'INPUT' &&
    (/^age$/i.test(el.placeholder || '') || el.type === 'number')
  );
}

// ── Select a <select> option by matching visible text ────────────────────────

function selectByText(selectEl, text) {
  if (!selectEl || !text) return false;
  const lower = text.toLowerCase();
  for (const opt of selectEl.options) {
    if (opt.text.toLowerCase().includes(lower)) {
      setNativeValue(selectEl, opt.value);
      return true;
    }
  }
  return false;
}

// ── Value maps ────────────────────────────────────────────────────────────────

const GENDER_MAP = { M: 'Male', F: 'Female', T: 'Transgender' };

const BERTH_MAP = {
  NP: 'No Preference', LB: 'Lower', MB: 'Middle', UB: 'Upper',
  SL: 'Side Lower',    SU: 'Side Upper', WS: 'Window'
};

const NAT_MAP = {
  IN: 'India',  AF: 'Afghan',      AU: 'Austral', BD: 'Bangla',
  BT: 'Bhutan', CN: 'China',       FR: 'France',  DE: 'German',
  GB: 'United Kingdom', JP: 'Japan', MV: 'Maldiv', NP: 'Nepal',
  PK: 'Pakist', LK: 'Sri Lanka',   US: 'United States', OT: 'Other'
};

// ── Main fill function ────────────────────────────────────────────────────────

async function fillPassengerForms(passengers) {
  // Debug: log all inputs found on page to help diagnose selector issues
  const allInputs   = document.querySelectorAll('input');
  const allSelects  = document.querySelectorAll('select');
  console.log('[IRCTC Autofill] Inputs on page:', allInputs.length, '| Selects:', allSelects.length);
  allInputs.forEach((el, i) =>
    console.log(`  input[${i}] type=${el.type} placeholder="${el.placeholder}" name="${el.name}" formControlName="${el.getAttribute('formcontrolname')}"`)
  );
  allSelects.forEach((el, i) => {
    const opts = Array.from(el.options).map(o => o.text).slice(0, 4).join(', ');
    console.log(`  select[${i}] name="${el.name}" options=[${opts}...]`);
  });

  const nameInputs = findPassengerRows();
  console.log('[IRCTC Autofill] Passenger name fields found:', nameInputs.length);

  if (nameInputs.length === 0) {
    return {
      success: false,
      message: 'No passenger form found. Make sure you are on the passenger entry step (/nget/booking/psgninput) and the form is fully loaded.'
    };
  }

  const count  = Math.min(passengers.length, nameInputs.length);
  let   filled = 0;

  for (let i = 0; i < count; i++) {
    const p         = passengers[i];
    const nameInput = nameInputs[i];
    const row       = getRowContainer(nameInput);

    console.log(`[IRCTC Autofill] Filling passenger ${i + 1}:`, p.name, '| row:',  row?.tagName, row?.className);

    // ── Name ────────────────────────────────────────────────────────────────
    nameInput.focus();
    setNativeValue(nameInput, p.name.toUpperCase());
    await sleep(200);

    // ── Age ─────────────────────────────────────────────────────────────────
    const ageEl = findAgeInput(row);
    if (ageEl) {
      ageEl.focus();
      setNativeValue(ageEl, String(p.age));
      await sleep(150);
    } else {
      console.warn('[IRCTC Autofill] Age input not found for row', i);
    }

    // ── Gender ──────────────────────────────────────────────────────────────
    const genderEl = findGenderSelect(row);
    if (genderEl) {
      selectByText(genderEl, GENDER_MAP[p.gender] || p.gender);
      await sleep(150);
    } else {
      console.warn('[IRCTC Autofill] Gender select not found for row', i);
    }

    // ── Nationality ──────────────────────────────────────────────────────────
    const natEl = findNatSelect(row);
    if (natEl) {
      selectByText(natEl, NAT_MAP[p.nationality] || 'India');
      await sleep(150);
    }

    // ── Berth ────────────────────────────────────────────────────────────────
    const berthEl = findBerthSelect(row);
    if (berthEl && p.berth !== 'NP') {
      selectByText(berthEl, BERTH_MAP[p.berth] || 'No Preference');
      await sleep(150);
    }

    filled++;
    await sleep(350);
  }

  return { success: true, filled };
}

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'FILL_PASSENGERS') return false;

  fillPassengerForms(message.passengers)
    .then(result => sendResponse(result))
    .catch(err   => sendResponse({ success: false, message: err.message }));

  return true; // keep channel open for async
});

console.log('[IRCTC Autofill] Content script ready ✓ (v2 — psgninput selectors)');
