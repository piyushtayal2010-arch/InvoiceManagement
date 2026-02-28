<<<<<<< ours
<<<<<<< ours
function renderSettingsPreview(settings = {}) {
  const preview = document.getElementById('settingsPreview');
  if (!preview) return;
  preview.innerHTML = `
    <div><strong>${settings.companyName || 'Company Name'}</strong></div>
    <div>${(settings.companyAddress || 'Company address').replace(/\n/g, '<br>')}</div>
    <div>${settings.companyEmail || 'company@email.com'}${settings.companyPhone ? ` | ${settings.companyPhone}` : ''}</div>
    <div style="margin-top:.5rem;"><strong>Prefix:</strong> ${settings.invoicePrefix || '(none)'} | <strong>Currency:</strong> ${settings.defaultCurrency || 'CAD'} | <strong>Terms:</strong> ${settings.defaultPaymentTerms || 0} days</div>
    <div style="margin-top:.5rem;"><strong>Payable To:</strong> ${settings.payableTo || settings.bankHolder || '-'} | <strong>Bank:</strong> ${settings.bankName || '-'}</div>
    <div><strong>Bank Address:</strong> ${settings.bankAddress || '-'}</div>
  `;
=======
=======
// settings.js handles reading and writing invoice settings to localStorage

>>>>>>> theirs
const STORAGE_KEY = 'invoiceSettings';

function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Settings parse error', e);
    return {};
  }
>>>>>>> theirs
}

function populateForm(s = {}) {
  const fields = [
    'companyName', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGstin', 'signatoryName',
    'bankName', 'bankAddress', 'bankAccount', 'bankHolder', 'payableTo', 'bankSwift', 'bankUpi', 'defaultNotes',
    'defaultTaxPct', 'defaultPaymentTerms', 'invoicePrefix'
  ];

  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = s[id] ?? '';
  });

<<<<<<< ours
  document.getElementById('defaultCurrency').value = s.defaultCurrency || 'CAD';
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Tabs.init(document.querySelectorAll('.tabs'));
=======
function populateForm() {
  const s = loadSettings();
<<<<<<< ours
  const fields = [
    'companyName', 'companyTagline', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGstin',
    'bankName', 'bankAccount', 'bankHolder', 'payableTo', 'bankSwift', 'bankUpi', 'defaultNotes', 'signatoryName',
    'defaultTaxPct', 'defaultPaymentTerms', 'invoicePrefix', 'invoiceTitle', 'taxLabel'
  ];

  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = s[id] ?? '';
  });

  document.getElementById('defaultCurrency').value = s.defaultCurrency || 'CAD';
  M.FormSelect.init(document.querySelectorAll('select'));
>>>>>>> theirs
=======
  document.getElementById('companyName').value = s.companyName || '';
  document.getElementById('companyAddress').value = s.companyAddress || '';
  document.getElementById('companyEmail').value = s.companyEmail || '';
  document.getElementById('companyPhone').value = s.companyPhone || '';
  document.getElementById('companyGstin').value = s.companyGstin || '';
  document.getElementById('bankName').value = s.bankName || '';
  document.getElementById('bankAccount').value = s.bankAccount || '';
  document.getElementById('bankHolder').value = s.bankHolder || '';
  document.getElementById('bankSwift').value = s.bankSwift || '';
  document.getElementById('bankUpi').value = s.bankUpi || '';
  // update labels for Materialize
>>>>>>> theirs
  M.updateTextFields();
  renderSettingsPreview(s);
}

function gatherForm() {
<<<<<<< ours
  const out = {};
  [
<<<<<<< ours
    'companyName', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGstin', 'signatoryName',
    'bankName', 'bankAddress', 'bankAccount', 'bankHolder', 'payableTo', 'bankSwift', 'bankUpi', 'defaultNotes',
    'invoicePrefix'
=======
    'companyName', 'companyTagline', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGstin',
    'bankName', 'bankAccount', 'bankHolder', 'payableTo', 'bankSwift', 'bankUpi', 'defaultNotes', 'signatoryName',
    'invoicePrefix', 'invoiceTitle', 'taxLabel'
>>>>>>> theirs
  ].forEach((id) => {
    out[id] = document.getElementById(id).value.trim();
  });

  out.defaultCurrency = document.getElementById('defaultCurrency').value;
  out.defaultTaxPct = Number(document.getElementById('defaultTaxPct').value) || 0;
  out.defaultPaymentTerms = Number(document.getElementById('defaultPaymentTerms').value) || 0;
  return out;
=======
  return {
    companyName: document.getElementById('companyName').value,
    companyAddress: document.getElementById('companyAddress').value,
    companyEmail: document.getElementById('companyEmail').value,
    companyPhone: document.getElementById('companyPhone').value,
    companyGstin: document.getElementById('companyGstin').value,
    bankName: document.getElementById('bankName').value,
    bankAccount: document.getElementById('bankAccount').value,
    bankHolder: document.getElementById('bankHolder').value,
    bankSwift: document.getElementById('bankSwift').value,
    bankUpi: document.getElementById('bankUpi').value
  };
>>>>>>> theirs
}

window.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('saveSettings')) return;

  const ok = await window.Auth.requireAuth();
  if (!ok) return;

  try {
    const settings = await window.Api.getSettings();
    populateForm(settings || {});
  } catch (err) {
    populateForm({});
    M.toast({ html: err.message || 'Failed to load settings' });
  }

  document.getElementById('saveSettings').addEventListener('click', async (e) => {
    e.preventDefault();
<<<<<<< ours
<<<<<<< ours
    const current = gatherForm();
    try {
      await window.Api.saveSettings(current);
      renderSettingsPreview(current);
      M.toast({ html: 'Settings saved' });
    } catch (err) {
      M.toast({ html: err.message || 'Save failed' });
    }
  });

  document.querySelectorAll('#tabBusiness input, #tabBusiness textarea, #tabDefaults input, #tabDefaults textarea, #tabDefaults select, #tabPayment input').forEach((el) => {
    el.addEventListener('input', () => renderSettingsPreview(gatherForm()));
    el.addEventListener('change', () => renderSettingsPreview(gatherForm()));
=======
    saveSettings(gatherForm());
    M.toast({ html: 'Settings saved' });
>>>>>>> theirs
=======
    const settings = gatherForm();
    saveSettings(settings);
    M.toast({html: 'Settings saved'});
>>>>>>> theirs
  });
});