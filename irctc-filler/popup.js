/**
 * popup.js — IRCTC Passenger Autofill
 * Handles: loading/saving passengers, rendering cards, form logic, fill trigger.
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_PASSENGERS = 6;
const STORAGE_KEY    = 'irctc_passengers';

// ── DOM refs ─────────────────────────────────────────────────────────────────

const $list       = document.getElementById('passengerList');
const $empty      = document.getElementById('emptyState');
const $count      = document.getElementById('passengerCount');
const $formLabel  = document.getElementById('formLabel');
const $editIndex  = document.getElementById('editIndex');
const $toast      = document.getElementById('toast');

// form fields
const $name        = document.getElementById('name');
const $age         = document.getElementById('age');
const $gender      = document.getElementById('gender');
const $berth       = document.getElementById('berth');
const $nationality = document.getElementById('nationality');

// buttons
const $btnSave   = document.getElementById('btnSave');
const $btnCancel = document.getElementById('btnCancel');
const $btnFill   = document.getElementById('btnFill');

// ── State ─────────────────────────────────────────────────────────────────────

let passengers = []; // array of passenger objects

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Show a brief toast notification */
function showToast(msg, type = 'info') {
  $toast.textContent = msg;
  $toast.className   = `toast ${type}`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { $toast.className = 'toast hidden'; }, 2500);
}

/** Persist passengers array to chrome.storage.local */
function saveToStorage(list) {
  return new Promise(resolve =>
    chrome.storage.local.set({ [STORAGE_KEY]: list }, resolve)
  );
}

/** Load passengers from chrome.storage.local */
function loadFromStorage() {
  return new Promise(resolve =>
    chrome.storage.local.get([STORAGE_KEY], res =>
      resolve(res[STORAGE_KEY] || [])
    )
  );
}

// Berth & nationality label lookups for display
const BERTH_LABELS = {
  NP: 'No Pref', LB: 'Lower', MB: 'Middle', UB: 'Upper',
  SL: 'Side Lower', SU: 'Side Upper', WS: 'Window Side'
};
const GENDER_LABELS = { M: 'Male', F: 'Female', T: 'Transgender' };
const NAT_LABELS = {
  IN:'Indian', AF:'Afghan', AU:'Australian', BD:'Bangladeshi', BT:'Bhutanese',
  CN:'Chinese', FR:'French', DE:'German', GB:'British', JP:'Japanese',
  MV:'Maldivian', NP:'Nepali', PK:'Pakistani', LK:'Sri Lankan', US:'American', OT:'Other'
};

// ── Render ────────────────────────────────────────────────────────────────────

function renderList() {
  $list.innerHTML = '';
  $count.textContent = `${passengers.length} / ${MAX_PASSENGERS}`;
  $empty.style.display = passengers.length === 0 ? 'block' : 'none';

  passengers.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'pax-card';
    li.innerHTML = `
      <div class="pax-number">${i + 1}</div>
      <div class="pax-info">
        <div class="pax-name">${escHtml(p.name)}</div>
        <div class="pax-meta">
          ${p.age}y · ${GENDER_LABELS[p.gender] || p.gender} · ${BERTH_LABELS[p.berth] || p.berth} · ${NAT_LABELS[p.nationality] || p.nationality}
        </div>
      </div>
      <div class="pax-actions">
        <button class="btn-icon edit" title="Edit" data-i="${i}">✏️</button>
        <button class="btn-icon del"  title="Delete" data-i="${i}">🗑️</button>
      </div>`;
    $list.appendChild(li);
  });

  // Attach card-level event listeners
  $list.querySelectorAll('.btn-icon.edit').forEach(btn =>
    btn.addEventListener('click', () => startEdit(+btn.dataset.i))
  );
  $list.querySelectorAll('.btn-icon.del').forEach(btn =>
    btn.addEventListener('click', () => deletePassenger(+btn.dataset.i))
  );

  // Disable Fill button if no passengers saved
  $btnFill.disabled = passengers.length === 0;
}

/** Simple HTML escape to avoid XSS from stored names */
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Form helpers ──────────────────────────────────────────────────────────────

function clearForm() {
  $name.value        = '';
  $age.value         = '';
  $gender.value      = '';
  $berth.value       = 'NP';
  $nationality.value = 'IN';
  $editIndex.value   = '-1';
  $formLabel.textContent = 'ADD PASSENGER';
  $btnSave.textContent   = '💾 Save';
  $btnCancel.classList.add('hidden');
}

function startEdit(i) {
  const p = passengers[i];
  $name.value        = p.name;
  $age.value         = p.age;
  $gender.value      = p.gender;
  $berth.value       = p.berth;
  $nationality.value = p.nationality;
  $editIndex.value   = i;
  $formLabel.textContent = 'EDIT PASSENGER';
  $btnSave.textContent   = '💾 Update';
  $btnCancel.classList.remove('hidden');
  // Scroll form into view
  $name.focus();
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

/** Read & validate form, return object or null */
function readForm() {
  const name = $name.value.trim();
  const age  = parseInt($age.value, 10);

  if (!name)                  { showToast('⚠️ Name is required', 'error');          return null; }
  if (isNaN(age) || age < 0 || age > 125)
                              { showToast('⚠️ Enter a valid age (0–125)', 'error'); return null; }
  if (!$gender.value)         { showToast('⚠️ Please select a gender', 'error');    return null; }

  return {
    name,
    age,
    gender:      $gender.value,
    berth:       $berth.value,
    nationality: $nationality.value
  };
}

// ── CRUD actions ──────────────────────────────────────────────────────────────

async function savePassenger() {
  const data = readForm();
  if (!data) return;

  const idx = parseInt($editIndex.value, 10);

  if (idx === -1) {
    // Adding new passenger
    if (passengers.length >= MAX_PASSENGERS) {
      showToast(`⚠️ Max ${MAX_PASSENGERS} passengers allowed`, 'error');
      return;
    }
    passengers.push(data);
    showToast('✅ Passenger added!', 'success');
  } else {
    // Updating existing
    passengers[idx] = data;
    showToast('✅ Passenger updated!', 'success');
  }

  await saveToStorage(passengers);
  clearForm();
  renderList();
}

async function deletePassenger(i) {
  passengers.splice(i, 1);
  await saveToStorage(passengers);
  clearForm();
  renderList();
  showToast('🗑️ Passenger removed');
}

// ── Fill action ───────────────────────────────────────────────────────────────

/**
 * Sends a message to the content script on the active IRCTC tab
 * asking it to fill in the passenger form fields.
 */
async function fillPassengers() {
  if (passengers.length === 0) {
    showToast('⚠️ No passengers saved yet', 'error');
    return;
  }

  // Get current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.includes('irctc.co.in')) {
    showToast('⚠️ Please open IRCTC booking page first', 'error');
    return;
  }

  // Always re-inject the content script so the latest version is running.
  // Chrome silently replaces any prior instance.
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files:  ['content.js']
    });
    // Small delay to let the script initialise before we message it
    await new Promise(r => setTimeout(r, 300));
  } catch (err) {
    console.warn('[IRCTC Autofill] Script injection warning:', err.message);
  }

  // Send passenger data to content script
  chrome.tabs.sendMessage(
    tab.id,
    { action: 'FILL_PASSENGERS', passengers },
    (response) => {
      if (chrome.runtime.lastError) {
        showToast('❌ Could not reach page. Reload IRCTC and try again.', 'error');
        return;
      }
      if (response && response.success) {
        showToast(`✅ Filled ${response.filled} passenger(s)!`, 'success');
      } else {
        showToast('⚠️ ' + (response?.message || 'Could not fill fields'), 'error');
      }
    }
  );
}

// ── Event listeners ───────────────────────────────────────────────────────────

$btnSave.addEventListener('click',   savePassenger);
$btnCancel.addEventListener('click', clearForm);
$btnFill.addEventListener('click',   fillPassengers);

// ── Init ──────────────────────────────────────────────────────────────────────

(async () => {
  passengers = await loadFromStorage();
  renderList();
})();
