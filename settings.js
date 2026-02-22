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
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function populateForm() {
  const s = loadSettings();
  const fields = [
    'companyName', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGstin', 'signatoryName',
    'bankName', 'bankAccount', 'bankHolder', 'payableTo', 'bankSwift', 'bankUpi', 'defaultNotes',
    'defaultTaxPct', 'defaultPaymentTerms', 'invoicePrefix'
  ];

  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = s[id] ?? '';
  });

  document.getElementById('defaultCurrency').value = s.defaultCurrency || 'CAD';
  M.FormSelect.init(document.querySelectorAll('select'));
  M.updateTextFields();
}

function gatherForm() {
  const out = {};
  [
    'companyName', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGstin', 'signatoryName',
    'bankName', 'bankAccount', 'bankHolder', 'payableTo', 'bankSwift', 'bankUpi', 'defaultNotes',
    'invoicePrefix'
  ].forEach((id) => {
    out[id] = document.getElementById(id).value.trim();
  });

  out.defaultCurrency = document.getElementById('defaultCurrency').value;
  out.defaultTaxPct = Number(document.getElementById('defaultTaxPct').value) || 0;
  out.defaultPaymentTerms = Number(document.getElementById('defaultPaymentTerms').value) || 0;
  return out;
}

window.addEventListener('DOMContentLoaded', () => {
  populateForm();
  document.getElementById('saveSettings').addEventListener('click', (e) => {
    e.preventDefault();
    saveSettings(gatherForm());
    M.toast({ html: 'Settings saved' });
  });
});
