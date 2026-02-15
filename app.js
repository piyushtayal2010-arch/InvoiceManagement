// helper to load clients for dropdown
function loadClientsForDropdown() {
  const raw = localStorage.getItem('invoiceClients');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function populateClientDropdown() {
  const select = document.getElementById('clientSelect');
  if (!select) return;
  // clear existing
  select.innerHTML = '<option value="" disabled selected>Choose client</option>';
  loadClientsForDropdown().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.email;
    opt.text = c.name;
    select.appendChild(opt);
  });
  M.FormSelect.init(select);
}

function fillClientFields(email) {
  const clients = loadClientsForDropdown();
  const c = clients.find(x => x.email === email);
  if (!c) return;
  document.getElementById('clientName').value = c.name;
  document.getElementById('clientAddress').value = c.address;
  document.getElementById('clientEmail').value = c.email;
  document.getElementById('clientPhone').value = c.phone;
  document.getElementById('paymentTerms').value = c.terms || '';
  M.updateTextFields();
}

// helper to load services for dropdown
function loadServicesForDropdown() {
  const raw = localStorage.getItem('invoiceServices');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function populateServiceDropdown() {
  const select = document.getElementById('serviceSelect');
  if (!select) return;
  // clear existing
  select.innerHTML = '<option value="" disabled selected>Choose service</option>';
  loadServicesForDropdown().forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.text = s.name;
    select.appendChild(opt);
  });
  M.FormSelect.init(select);
}

function fillServiceFields(name) {
  const services = loadServicesForDropdown();
  const s = services.find(x => x.name === name);
  if (!s) return;
  document.getElementById('serviceName').value = s.name;
  document.getElementById('hsn').value = s.hsn;
  document.getElementById('serviceDesc').value = s.desc || '';
  M.updateTextFields();
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

function generatePDF() {
  console.log('generatePDF invoked');
  try {
    // load jsPDF and autotable plugin
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // set consistent line height and factor for later text blocks
    doc.setLineHeightFactor(1.2);
    const lineHeight = 5; // slightly tighter spacing for addresses

  // gather values from inputs
  const invoiceNo = document.getElementById('invoiceNo').value;
  const invoiceDate = document.getElementById('invoiceDate').value;
  const client = document.getElementById('clientName').value;
  const clientAddress = document.getElementById('clientAddress').value;
  const email = document.getElementById('clientEmail').value;
  const phone = document.getElementById('clientPhone').value;
  const service = document.getElementById('serviceName').value;
  const hsn = document.getElementById('hsn').value;
  const serviceDesc = document.getElementById('serviceDesc') ? document.getElementById('serviceDesc').value : '';
  const period = document.getElementById('period').value;
  const paymentTerms = document.getElementById('paymentTerms') ? document.getElementById('paymentTerms').value : '';
  // calculate due date by adding paymentTerms (days) to invoiceDate
  let dueDate = '';
  if (invoiceDate) {
    const inv = new Date(invoiceDate);
    const days = parseInt(paymentTerms, 10) || 0;
    inv.setDate(inv.getDate() + days);
    // format yyyy-mm-dd for PDF display
    dueDate = inv.toISOString().slice(0, 10);
  }
  const qty = Number(document.getElementById('qty').value) || 0;
  const rate = Number(document.getElementById('rate').value) || 0;
  const amount = qty * rate;

  // header section (populated from settings if available)
  const settings = getSettings();
  const name = settings.companyName || 'IMAGINE STUDIOS';
  const address = settings.companyAddress || 'S/o Girdhari Lal Aharwal, Purohit Vas, Post - J.K. Puram,\nAdarsh, Sirohi, Rajasthan, IN - 307022';
  const contact = (settings.companyPhone ? settings.companyPhone + ' | ' : '') + (settings.companyEmail || 'piyushtayal2010@gmail.com');
  const gstin = settings.companyGstin ? 'GSTIN : ' + settings.companyGstin : '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(name, 20, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const lines = address.split('\n');
  let ay = 25;
  lines.forEach(line => {
    doc.text(line, 20, ay);
    ay += 4;
  });
  doc.text(contact, 20, ay);
  ay += 4;
  if (gstin) {
    doc.text(gstin, 20, ay);
    ay += 4;
  }

  // horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);

  // invoice title and details
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, 52, null, null, 'center');

  // position invoice metadata at same y as "Bill To" heading and right-align
  const invY = 60;
  const rightX = 190; // near right margin
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice # : ${invoiceNo}`, rightX, invY - 2, null, null, 'right');
  doc.text(`Invoice Date : ${invoiceDate}`, rightX, invY + 2, null, null, 'right');
  if (dueDate) {
    doc.text(`Due Date : ${dueDate}`, rightX, invY + lineHeight, null, null, 'right');
  }

  // bill to section with dynamic spacing
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To', 20, invY);
  doc.setFont('helvetica', 'normal');
  let billY = invY + lineHeight;
  doc.text(client, 20, billY);
  // uniform spacing: advance by full lineHeight before each subsequent line
  billY += lineHeight;
  // split address into non-empty, trimmed lines
  const clientAddrLines = clientAddress
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  clientAddrLines.forEach(line => {
    doc.text(line, 20, billY);
    billY += lineHeight;
  });
  doc.text(email, 20, billY);
  billY += lineHeight;
  doc.text(phone, 20, billY);
  billY += lineHeight;

  // item table
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableStart = billY + lineHeight;
  doc.autoTable({
    startY: tableStart,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
    head: [[
      { content: 'Sr no.', styles: { halign: 'center' } },
      'Product/Services',
      { content: 'Qty', styles: { halign: 'right' } },
      { content: 'Rate', styles: { halign: 'right' } },
      { content: 'Tax', styles: { halign: 'right' } },
      { content: 'Amount', styles: { halign: 'right' } }
    ]],
    body: [[
      '1',
      service + '\nHSN Code : ' + hsn + (serviceDesc ? '\nDescription: ' + serviceDesc : '') + '\n' + period,
      qty.toString(),
      rate.toFixed(2),
      '0.00',
      amount.toFixed(2)
    ]],
    styles: { fontSize: 9, overflow: 'linebreak' },
    headStyles: { fillColor: [0, 70, 136], textColor: 255 },
    columnStyles: {
      0: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    },
    tableLineWidth: 0.1,
    tableLineColor: 200,
    theme: 'grid'
  });

  // totals section below table
  const finalY = doc.lastAutoTable.finalY + 5;
  doc.text(`Base Amount`, 140, finalY);
  doc.text(`$ ${amount.toFixed(2)}`, 190, finalY, null, null, 'right');
  doc.text(`(+) IGST: 0.00%`, 140, finalY + 6);
  doc.text(`$ 0.00`, 190, finalY + 6, null, null, 'right');
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total`, 140, finalY + 14);
  doc.text(`$ ${amount.toFixed(2)}`, 190, finalY + 14, null, null, 'right');
  doc.setFont('helvetica', 'normal');

  // declaration/note
  doc.setFontSize(9);
  doc.text('Please Note', 20, finalY + 25);
  doc.setFontSize(8);
  doc.text('1. Currency: Canadian Dollar (CAD)', 20, finalY + 30);
  doc.text('2. Declaration: Supply meant for export of services under Letter of Undertaking (LUT) without payment of IGST, as per Section 16 of the IGST Act, 2017.', 20, finalY + 34, { maxWidth: 170 });

  // payable & banking details boxes
  const boxY = finalY + 55;
  doc.rect(20, boxY, 85, 30); // payable box
  doc.rect(110, boxY, 85, 30); // banking box
  doc.setFontSize(9);
  doc.text('Payable To', 22, boxY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('PIYUSH TAYAL', 22, boxY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Bank Details', 112, boxY + 5);
  const bankName = settings.bankName || 'STATE BANK OF INDIA';
  const bankAcct = settings.bankAccount || '20231430486';
  const bankHolder = settings.bankHolder || 'PIYUSH TAYAL';
  const bankSwift = settings.bankSwift || 'SBININBBJ12';
  const bankUpi = settings.bankUpi || '7014882361sbi@ybI';
  doc.text(`BANK NAME: ${bankName}`, 112, boxY + 10);
  doc.text(`ACCOUNT HOLDER NAME: ${bankHolder}`, 112, boxY + 14);
  doc.text(`ACCOUNT NUMBER: ${bankAcct}`, 112, boxY + 18);
  doc.text(`SWIFT CODE: ${bankSwift}`, 112, boxY + 22);
  doc.text(`UPI ID: ${bankUpi}`, 112, boxY + 26);
  
  // signature
  doc.text('Piyush Tayal', 150, boxY + 40);
  doc.text('Signature', 150, boxY + 46);

  doc.save(`Invoice_${invoiceNo}.pdf`);
  } catch (err) {
    console.error('generatePDF error', err);
    alert('Failed to generate PDF: ' + err.message);
  }
}

// initialize client selector when page loads
window.addEventListener('DOMContentLoaded', () => {
  populateClientDropdown();
  const sel = document.getElementById('clientSelect');
  if (sel) {
    sel.addEventListener('change', () => {
      fillClientFields(sel.value);
    });
  }
  populateServiceDropdown();
  const srvSel = document.getElementById('serviceSelect');
  if (srvSel) {
    srvSel.addEventListener('change', () => {
      fillServiceFields(srvSel.value);
    });
  }
});

// expose globally just in case
window.generatePDF = generatePDF;