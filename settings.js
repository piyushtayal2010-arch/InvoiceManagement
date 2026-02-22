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

function renderSettingsPreview(settings = loadSettings()) {
  const preview = document.getElementById('settingsPreview');
  if (!preview) return;
  preview.innerHTML = `
    <div><strong>${settings.companyName || 'Company Name'}</strong></div>
    <div>${(settings.companyAddress || 'Company address').replace(/\n/g, '<br>')}</div>
    <div>${settings.companyEmail || 'company@email.com'}${settings.companyPhone ? ` | ${settings.companyPhone}` : ''}</div>
    <div style="margin-top:.5rem;"><strong>Prefix:</strong> ${settings.invoicePrefix || '(none)'} | <strong>Currency:</strong> ${settings.defaultCurrency || 'CAD'} | <strong>Terms:</strong> ${settings.defaultPaymentTerms || 0} days</div>
    <div style="margin-top:.5rem;"><strong>Payable To:</strong> ${settings.payableTo || settings.bankHolder || '-'} | <strong>Bank:</strong> ${settings.bankName || '-'}</div>
  `;
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
  M.Tabs.init(document.querySelectorAll('.tabs'));
  M.updateTextFields();
  renderSettingsPreview(s);
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
    const current = gatherForm();
    saveSettings(current);
    renderSettingsPreview(current);
    M.toast({ html: 'Settings saved' });
  });

  document.querySelectorAll('#tabBusiness input, #tabBusiness textarea, #tabDefaults input, #tabDefaults textarea, #tabDefaults select, #tabPayment input').forEach((el) => {
    el.addEventListener('input', () => renderSettingsPreview(gatherForm()));
    el.addEventListener('change', () => renderSettingsPreview(gatherForm()));
  });
});
