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
    'bankName', 'bankAddress', 'bankAccount', 'bankHolder', 'payableTo', 'bankSwift', 'bankUpi', 'defaultNotes',
    'invoicePrefix'
  ].forEach((id) => {
    out[id] = document.getElementById(id).value.trim();
  });

  out.defaultCurrency = document.getElementById('defaultCurrency').value;
  out.defaultTaxPct = Number(document.getElementById('defaultTaxPct').value) || 0;
  out.defaultPaymentTerms = Number(document.getElementById('defaultPaymentTerms').value) || 0;
  return out;
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
  });
});
