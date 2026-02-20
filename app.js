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

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setLineHeightFactor(1.2);

    const invoiceNo = document.getElementById('invoiceNo').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const client = document.getElementById('clientName').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('clientPhone').value;
    const paymentTerms = document.getElementById('paymentTerms')?.value || '';
    const notes = document.getElementById('invoiceNotes')?.value || '';

    let dueDate = '';
    if (invoiceDate) {
      const inv = new Date(invoiceDate);
      const days = parseInt(paymentTerms, 10) || 0;
      inv.setDate(inv.getDate() + days);
      dueDate = inv.toISOString().slice(0, 10);
    }

    const settings = getSettings();
    const name = settings.companyName || 'Company Name';
    const address = settings.companyAddress || 'Company address not configured';
    const contact = (settings.companyPhone ? `${settings.companyPhone} | ` : '') + (settings.companyEmail || 'Email not configured');
    const gstin = settings.companyGstin ? `GSTIN : ${settings.companyGstin}` : '';
    const bankName = settings.bankName || 'Bank not configured';
    const bankAcct = settings.bankAccount || 'Account number not configured';
    const bankHolder = settings.bankHolder || 'Account holder not configured';
    const bankSwift = settings.bankSwift || 'Code not configured';
    const bankUpi = settings.bankUpi || 'Payment handle not configured';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(name, 20, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let ay = 25;
    address.split('\n').forEach((line) => {
      doc.text(line, 20, ay);
      ay += 4;
    });
    doc.text(contact, 20, ay);
    ay += 4;
    if (gstin) {
      doc.text(gstin, 20, ay);
      ay += 4;
    }

    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 52, null, null, 'center');

    const invY = 60;
    const rightX = 190;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice # : ${invoiceNo}`, rightX, invY - 2, null, null, 'right');
    doc.text(`Invoice Date : ${invoiceDate}`, rightX, invY + 2, null, null, 'right');
    doc.text(`Currency : ${getCurrency()}`, rightX, invY + 6, null, null, 'right');
    if (dueDate) {
      doc.text(`Due Date : ${dueDate}`, rightX, invY + 10, null, null, 'right');
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', 20, invY);
    doc.setFont('helvetica', 'normal');
    let billY = invY + 5;
    doc.text(client, 20, billY);
    billY += 5;
    clientAddress
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length)
      .forEach((line) => {
        doc.text(line, 20, billY);
        billY += 5;
      });
    doc.text(email, 20, billY);
    billY += 5;
    doc.text(phone, 20, billY);

    const tableBody = invoiceItems.map((item, index) => {
      const taxAmount = item.amount * (item.taxPct / 100);
      return [
        `${index + 1}`,
        `${item.serviceName}\nHSN: ${item.hsn || '-'}${item.serviceDesc ? `\n${item.serviceDesc}` : ''}${item.period ? `\n${item.period}` : ''}`,
        item.qty.toString(),
        item.rate.toFixed(2),
        `${item.taxPct.toFixed(2)}%`,
        taxAmount.toFixed(2),
        item.amount.toFixed(2)
      ];
    });

    doc.autoTable({
      startY: billY + 8,
      margin: { left: 20, right: 20 },
      head: [[
        'Sr No.',
        'Services',
        'Qty',
        'Rate',
        'Tax %',
        'Tax Amt',
        'Amount'
      ]],
      body: tableBody,
      styles: { fontSize: 9, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 70, 136], textColor: 255 },
      columnStyles: {
        0: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      },
      theme: 'grid'
    });

    const totals = computeTotals();
    const finalY = doc.lastAutoTable.finalY + 6;
    doc.text('Subtotal', 140, finalY);
    doc.text(formatMoney(totals.subtotal), 190, finalY, null, null, 'right');
    doc.text('Tax', 140, finalY + 6);
    doc.text(formatMoney(totals.tax), 190, finalY + 6, null, null, 'right');
    doc.text('Discount', 140, finalY + 12);
    doc.text(`- ${formatMoney(totals.discount)}`, 190, finalY + 12, null, null, 'right');
    doc.text('Shipping / Extra', 140, finalY + 18);
    doc.text(formatMoney(totals.shipping), 190, finalY + 18, null, null, 'right');
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total', 140, finalY + 26);
    doc.text(formatMoney(totals.grandTotal), 190, finalY + 26, null, null, 'right');
    doc.setFont('helvetica', 'normal');

    doc.setFontSize(9);
    doc.text('Notes', 20, finalY + 10);
    doc.setFontSize(8);
    const composedNotes = notes || settings.defaultNotes || 'Thank you for your business.';
    doc.text(composedNotes, 20, finalY + 15, { maxWidth: 110 });

    const boxY = finalY + 35;
    doc.rect(20, boxY, 85, 30);
    doc.rect(110, boxY, 85, 30);
    doc.setFontSize(9);
    doc.text('Payable To', 22, boxY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(bankHolder, 22, boxY + 12);
    doc.setFont('helvetica', 'normal');
    doc.text('Bank Details', 112, boxY + 5);
    doc.text(`BANK NAME: ${bankName}`, 112, boxY + 10);
    doc.text(`ACCOUNT HOLDER NAME: ${bankHolder}`, 112, boxY + 14);
    doc.text(`ACCOUNT NUMBER: ${bankAcct}`, 112, boxY + 18);
    doc.text(`SWIFT CODE: ${bankSwift}`, 112, boxY + 22);
    doc.text(`UPI ID: ${bankUpi}`, 112, boxY + 26);

    doc.text(settings.signatoryName || 'Authorized Signatory', 145, boxY + 40);
    doc.text('Signature', 150, boxY + 46);

    doc.save(`Invoice_${invoiceNo || 'Draft'}.pdf`);
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
