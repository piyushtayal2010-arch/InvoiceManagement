// settings.js handles reading and writing invoice settings to localStorage

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
  document.getElementById('defaultCurrency').value = s.defaultCurrency || 'CAD';
  document.getElementById('defaultTaxPct').value = s.defaultTaxPct ?? 0;
  document.getElementById('defaultNotes').value = s.defaultNotes || '';
  document.getElementById('signatoryName').value = s.signatoryName || '';
  M.FormSelect.init(document.querySelectorAll('select'));
  M.updateTextFields();
}

function gatherForm() {
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
    bankUpi: document.getElementById('bankUpi').value,
    defaultCurrency: document.getElementById('defaultCurrency').value,
    defaultTaxPct: Number(document.getElementById('defaultTaxPct').value) || 0,
    defaultNotes: document.getElementById('defaultNotes').value,
    signatoryName: document.getElementById('signatoryName').value
  };
}

window.addEventListener('DOMContentLoaded', () => {
  populateForm();
  document.getElementById('saveSettings').addEventListener('click', (e) => {
    e.preventDefault();
    const settings = gatherForm();
    saveSettings(settings);
    M.toast({ html: 'Settings saved' });
  });
});
