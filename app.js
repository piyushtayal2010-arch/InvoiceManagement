function loadClientsForDropdown() {
  const raw = localStorage.getItem('invoiceClients');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function loadServicesForDropdown() {
  const raw = localStorage.getItem('invoiceServices');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function getSettings() {
  const raw = localStorage.getItem('invoiceSettings');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('invalid settings', e);
    return {};
  }
}

function populateClientDropdown() {
  const select = document.getElementById('clientSelect');
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>Choose client</option>';
  loadClientsForDropdown().forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.email;
    opt.text = `${c.name} (${c.email})`;
    select.appendChild(opt);
  });
  M.FormSelect.init(select);
}

function populateServiceDropdown() {
  const select = document.getElementById('serviceSelect');
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>Choose service</option>';
  loadServicesForDropdown().forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.text = s.name;
    select.appendChild(opt);
  });
  M.FormSelect.init(select);
}

function fillClientFields(email) {
  const c = loadClientsForDropdown().find((x) => x.email === email);
  if (!c) return;
  document.getElementById('clientName').value = c.name || '';
  document.getElementById('clientAddress').value = c.address || '';
  document.getElementById('clientEmail').value = c.email || '';
  document.getElementById('clientPhone').value = c.phone || '';
  document.getElementById('paymentTerms').value = c.terms || document.getElementById('paymentTerms').value;
  M.updateTextFields();
}

function fillServiceFields(name) {
  const s = loadServicesForDropdown().find((x) => x.name === name);
  if (!s) return;
  document.getElementById('serviceName').value = s.name || '';
  document.getElementById('hsn').value = s.hsn || '';
  document.getElementById('serviceDesc').value = s.desc || '';
  M.updateTextFields();
}

const invoiceItems = [];

function getCurrency() {
  return document.getElementById('currency')?.value || 'CAD';
}

function currencySymbol(code) {
  return { CAD: '$', USD: '$', EUR: '€', INR: '₹' }[code] || '$';
}

function formatMoney(amount) {
  return `${currencySymbol(getCurrency())} ${Number(amount || 0).toFixed(2)}`;
}

function readInput(id) {
  return document.getElementById(id).value.trim();
}

function collectCurrentItemFromForm() {
  const serviceName = readInput('serviceName');
  const hsn = readInput('hsn');
  const serviceDesc = readInput('serviceDesc');
  const period = readInput('period');
  const qty = Number(document.getElementById('qty').value) || 0;
  const rate = Number(document.getElementById('rate').value) || 0;
  const taxPct = Number(document.getElementById('itemTax').value) || 0;

  if (!serviceName) {
    M.toast({ html: 'Service name is required' });
    return null;
  }
  if (qty <= 0) {
    M.toast({ html: 'Quantity must be greater than 0' });
    return null;
  }
  if (rate < 0 || taxPct < 0) {
    M.toast({ html: 'Rate and tax cannot be negative' });
    return null;
  }

  return { serviceName, hsn, serviceDesc, period, qty, rate, taxPct, amount: qty * rate };
}

function clearItemForm() {
  ['serviceName', 'hsn', 'serviceDesc', 'period', 'qty', 'rate'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.getElementById('itemTax').value = document.getElementById('itemTax').value || '0';
  M.updateTextFields();
}

function addInvoiceItem() {
  const item = collectCurrentItemFromForm();
  if (!item) return;
  invoiceItems.push(item);
  clearItemForm();
  renderItemTable();
}

function removeInvoiceItem(index) {
  invoiceItems.splice(index, 1);
  renderItemTable();
}

function computeTotals() {
  const discount = Number(document.getElementById('discount').value) || 0;
  const shipping = Number(document.getElementById('shipping').value) || 0;
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = invoiceItems.reduce((sum, item) => sum + (item.amount * item.taxPct) / 100, 0);
  return { subtotal, tax, discount, shipping, grandTotal: Math.max(0, subtotal + tax + shipping - discount) };
}

function renderSummary() {
  const totals = computeTotals();
  document.getElementById('summarySubtotal').textContent = formatMoney(totals.subtotal);
  document.getElementById('summaryTax').textContent = formatMoney(totals.tax);
  document.getElementById('summaryTotal').textContent = formatMoney(totals.grandTotal);
}

function renderItemTable() {
  const tbody = document.getElementById('itemTableBody');
  tbody.innerHTML = '';

  if (!invoiceItems.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="center-align grey-text">No line items added yet.</td></tr>';
    renderSummary();
    return;
  }

  invoiceItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${item.serviceName}</strong>${item.hsn ? `<br>HSN: ${item.hsn}` : ''}${item.serviceDesc ? `<br>${item.serviceDesc}` : ''}${item.period ? `<br>${item.period}` : ''}</td>
      <td>${item.qty}</td>
      <td>${formatMoney(item.rate)}</td>
      <td>${item.taxPct.toFixed(2)}%</td>
      <td>${formatMoney(item.amount)}</td>
      <td><button class="btn-flat red-text"><i class="material-icons">delete</i></button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => removeInvoiceItem(index));
    tbody.appendChild(tr);
  });

  renderSummary();
}

function validateInvoiceBeforeDownload() {
  const required = [
    ['invoiceNo', 'Invoice number is required'],
    ['invoiceDate', 'Invoice date is required'],
    ['clientName', 'Client name is required'],
    ['clientEmail', 'Client email is required'],
    ['clientAddress', 'Client address is required']
  ];

  for (const [id, message] of required) {
    if (!readInput(id)) {
      M.toast({ html: message });
      document.getElementById(id).focus();
      return false;
    }
  }

  if (!invoiceItems.length) {
    M.toast({ html: 'Add at least one line item' });
    return false;
  }

  return true;
}

function generatePDF() {
  try {
    if (!validateInvoiceBeforeDownload()) return;

    const settings = getSettings();
    const invoiceNo = readInput('invoiceNo');
    const invoiceDate = readInput('invoiceDate');
    const clientName = readInput('clientName');
    const clientAddress = readInput('clientAddress');
    const clientEmail = readInput('clientEmail');
    const clientPhone = readInput('clientPhone');
    const paymentTerms = Number(document.getElementById('paymentTerms').value) || 0;
    const notes = readInput('invoiceNotes') || settings.defaultNotes || '';
    const currency = getCurrency();

    const issueDate = new Date(invoiceDate);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const companyName = settings.companyName || 'Company Name';
    const companyTagline = settings.companyTagline || '';
    const companyAddress = settings.companyAddress || 'Company address not set';
    const companyContact = [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' | ');
    const taxId = settings.companyGstin || '';
    const invoiceTitle = settings.invoiceTitle || 'INVOICE';
    const taxLabel = settings.taxLabel || 'Tax';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(companyName, 20, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (companyTagline) doc.text(companyTagline, 20, 23);
    let lineY = companyTagline ? 28 : 23;
    companyAddress.split('\n').forEach((line) => {
      doc.text(line, 20, lineY);
      lineY += 4;
    });
    if (companyContact) {
      doc.text(companyContact, 20, lineY);
      lineY += 4;
    }
    if (taxId) doc.text(`Tax ID: ${taxId}`, 20, lineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(invoiceTitle, 190, 24, { align: 'right' });

    const invoiceLabel = settings.invoicePrefix ? `${settings.invoicePrefix}-${invoiceNo}` : invoiceNo;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceLabel}`, 190, 32, { align: 'right' });
    doc.text(`Invoice Date: ${invoiceDate}`, 190, 37, { align: 'right' });
    doc.text(`Due Date: ${dueDate.toISOString().slice(0, 10)}`, 190, 42, { align: 'right' });
    doc.text(`Currency: ${currency}`, 190, 47, { align: 'right' });

    doc.line(20, 52, 190, 52);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName, 20, 66);
    clientAddress.split('\n').forEach((line, i) => doc.text(line, 20, 72 + i * 5));
    doc.text(clientEmail, 20, 82 + clientAddress.split('\n').length * 5);
    if (clientPhone) doc.text(clientPhone, 20, 87 + clientAddress.split('\n').length * 5);

    const body = invoiceItems.map((item, idx) => {
      const taxAmount = (item.amount * item.taxPct) / 100;
      return [
        String(idx + 1),
        `${item.serviceName}${item.hsn ? `\n${item.hsn}` : ''}${item.serviceDesc ? `\n${item.serviceDesc}` : ''}${item.period ? `\n${item.period}` : ''}`,
        item.qty.toFixed(0),
        item.rate.toFixed(2),
        `${item.taxPct.toFixed(2)}%`,
        taxAmount.toFixed(2),
        item.amount.toFixed(2)
      ];
    });

    doc.autoTable({
      startY: 98,
      margin: { left: 20, right: 20 },
      head: [['#', 'Service', 'Qty', 'Rate', `${taxLabel} %`, `${taxLabel} Amt`, 'Line Total']],
      body,
      headStyles: { fillColor: [91, 110, 245] },
      styles: { fontSize: 9 },
      theme: 'grid',
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } }
    });

    const totals = computeTotals();
    const y = doc.lastAutoTable.finalY + 8;
    doc.text('Subtotal', 145, y);
    doc.text(formatMoney(totals.subtotal), 190, y, { align: 'right' });
    doc.text(taxLabel, 145, y + 6);
    doc.text(formatMoney(totals.tax), 190, y + 6, { align: 'right' });
    doc.text('Discount', 145, y + 12);
    doc.text(`- ${formatMoney(totals.discount)}`, 190, y + 12, { align: 'right' });
    doc.text('Shipping', 145, y + 18);
    doc.text(formatMoney(totals.shipping), 190, y + 18, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total', 145, y + 26);
    doc.text(formatMoney(totals.grandTotal), 190, y + 26, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes', 20, y + 10);
    doc.setFontSize(8);
    doc.text(notes || 'No notes provided.', 20, y + 15, { maxWidth: 100 });

    const bankY = y + 35;
    doc.rect(20, bankY, 85, 34);
    doc.rect(110, bankY, 85, 34);
    doc.setFontSize(9);
    doc.text('Payable To', 22, bankY + 6);
    doc.text(settings.bankHolder || 'Account holder not set', 22, bankY + 12);
    doc.text('Bank Details', 112, bankY + 6);
    doc.text(`Bank: ${settings.bankName || '-'}`, 112, bankY + 12);
    doc.text(`Account: ${settings.bankAccount || '-'}`, 112, bankY + 17);
    doc.text(`SWIFT/IFSC: ${settings.bankSwift || '-'}`, 112, bankY + 22);
    doc.text(`UPI/Handle: ${settings.bankUpi || '-'}`, 112, bankY + 27);

    doc.text(settings.signatoryName || 'Authorized Signatory', 145, bankY + 41);
    doc.text('Signature', 150, bankY + 46);

    doc.save(`Invoice_${invoiceLabel}.pdf`);
  } catch (err) {
    console.error('generatePDF error', err);
    alert(`Failed to generate PDF: ${err.message}`);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  populateClientDropdown();
  populateServiceDropdown();

  const settings = getSettings();
  if (settings.defaultCurrency) document.getElementById('currency').value = settings.defaultCurrency;
  if (settings.defaultTaxPct !== undefined) document.getElementById('itemTax').value = settings.defaultTaxPct;
  if (settings.defaultPaymentTerms !== undefined) document.getElementById('paymentTerms').value = settings.defaultPaymentTerms;
  if (settings.defaultNotes) document.getElementById('invoiceNotes').value = settings.defaultNotes;

  document.getElementById('clientSelect')?.addEventListener('change', (e) => fillClientFields(e.target.value));
  document.getElementById('serviceSelect')?.addEventListener('change', (e) => fillServiceFields(e.target.value));
  document.getElementById('addItem').addEventListener('click', addInvoiceItem);

  ['discount', 'shipping', 'currency'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderSummary);
  });

  M.FormSelect.init(document.querySelectorAll('select'));
  M.updateTextFields();
  renderItemTable();
});

window.generatePDF = generatePDF;
