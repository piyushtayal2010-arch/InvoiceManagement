<<<<<<< ours
<<<<<<< ours
let clientsCache = [];
let servicesCache = [];
let settingsCache = {};
let draftsCache = [];

=======
>>>>>>> theirs
=======
// helper to load clients for dropdown
>>>>>>> theirs
function loadClientsForDropdown() {
  return clientsCache;
}

function loadServicesForDropdown() {
  return servicesCache;
}

function getSettings() {
  return settingsCache || {};
}

async function bootstrapRemoteData() {
  try {
    const data = await window.Api.bootstrap();
    clientsCache = Array.isArray(data?.clients) ? data.clients : [];
    servicesCache = Array.isArray(data?.services) ? data.services : [];
    settingsCache = data?.settings || {};
    draftsCache = Array.isArray(data?.drafts) ? data.drafts : [];
    return;
  } catch (_err) {
    // Fallback to individual endpoints if backend has not been restarted yet.
  }

  const [clients, services, settings, drafts] = await Promise.all([
    window.Api.getClients(),
    window.Api.getServices(),
    window.Api.getSettings(),
    window.Api.getDrafts()
  ]);
  clientsCache = Array.isArray(clients) ? clients : [];
  servicesCache = Array.isArray(services) ? services : [];
  settingsCache = settings || {};
  draftsCache = Array.isArray(drafts) ? drafts : [];
}

function populateClientDropdown() {
  const select = document.getElementById('clientSelect');
  if (!select) return;
  // clear existing
  select.innerHTML = '<option value="" disabled selected>Choose client</option>';
  loadClientsForDropdown().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.email;
<<<<<<< ours
<<<<<<< ours
    opt.text = `${c.name}`;
=======
    opt.text = `${c.name} (${c.email})`;
>>>>>>> theirs
=======
    opt.text = c.name;
>>>>>>> theirs
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

<<<<<<< ours
const invoiceItems = [];
<<<<<<< ours
let isDirty = false;
=======
>>>>>>> theirs

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

<<<<<<< ours
function buildDisplayInvoiceNo(prefix, invoiceNo) {
  return `${prefix ? `${prefix}` : ''}${invoiceNo || 'Draft'}`;
}

function formatPeriodDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function normalizeServicePeriod(rawPeriod) {
  const raw = String(rawPeriod || '').trim();
  if (!raw) return '';
  const matches = raw.match(/\d{4}-\d{2}-\d{2}/g) || [];
  if (matches.length >= 2) {
    return `[${formatPeriodDate(matches[0])} - ${formatPeriodDate(matches[1])}]`;
  }
  if (matches.length === 1) {
    return formatPeriodDate(matches[0]);
  }
  return raw;
}

function renderInvoicePrefixInline(settings = getSettings()) {
  const prefixEl = document.getElementById('invoicePrefixInline');
  const groupEl = document.querySelector('.invoice-no-group');
  if (!prefixEl || !groupEl) return;

  const prefix = String(settings.invoicePrefix || '').trim();
  prefixEl.textContent = prefix;
  if (!prefix) {
    prefixEl.style.display = 'none';
    groupEl.style.setProperty('--invoice-prefix-offset', '0px');
    return;
  }

  prefixEl.style.display = 'block';
  const prefixWidth = Math.ceil(prefixEl.getBoundingClientRect().width);
  groupEl.style.setProperty('--invoice-prefix-offset', `${prefixWidth + 12}px`);
}

function setDirtyState(dirty) {
  isDirty = dirty;
  const dirtyState = document.getElementById('dirtyState');
  if (!dirtyState) return;
  dirtyState.className = `dirty-state ${dirty ? 'dirty' : 'clean'}`;
  dirtyState.textContent = dirty ? 'Unsaved changes' : 'All changes saved';
}

function showValidationBanner(messages) {
  const banner = document.getElementById('validationBanner');
  if (!banner) return;
  if (!messages?.length) {
    banner.classList.add('hide');
    banner.textContent = '';
    return;
  }
  banner.textContent = messages.join(' | ');
  banner.classList.remove('hide');
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach((el) => el.remove());
  document.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
}

function setFieldError(id, message) {
  const input = document.getElementById(id);
  if (!input) return;
  input.classList.add('invalid');
  const container = input.closest('.input-field');
  if (!container) return;
  const existing = container.querySelector('.field-error');
  if (existing) existing.remove();
  const msg = document.createElement('div');
  msg.className = 'field-error red-text';
  msg.style.fontSize = '0.78rem';
  msg.textContent = message;
  container.appendChild(msg);
}

function loadDrafts() {
  return draftsCache;
}

function saveDrafts(drafts) {
  draftsCache = [...drafts];
  window.Api.replaceDrafts(drafts).catch((err) => {
    console.error('save drafts failed', err);
    M.toast({ html: 'Failed to save drafts to server' });
  });
}

function collectInvoiceState() {
  return {
    id: readInput('invoiceNo') || `DRAFT-${Date.now()}`,
    updatedAt: new Date().toISOString(),
    invoiceNo: readInput('invoiceNo'),
    invoiceDate: readInput('invoiceDate'),
    paymentTerms: readInput('paymentTerms'),
    currency: document.getElementById('currency')?.value || 'CAD',
    clientName: readInput('clientName'),
    clientEmail: readInput('clientEmail'),
    clientAddress: readInput('clientAddress'),
    clientPhone: readInput('clientPhone'),
    discount: readInput('discount'),
    shipping: readInput('shipping'),
    invoiceNotes: readInput('invoiceNotes'),
    items: [...invoiceItems]
  };
}

function buildInvoicePersistPayload() {
  const totals = computeTotals();
  const draftState = collectInvoiceState();
  return {
    id: readInput('invoiceRecordId') || undefined,
    invoiceNo: draftState.invoiceNo,
    invoiceDate: draftState.invoiceDate,
    clientName: draftState.clientName,
    clientEmail: draftState.clientEmail,
    currency: draftState.currency,
    grandTotal: totals.grandTotal,
    status: 'sent',
    payload: draftState
  };
}

function applyInvoiceState(draft) {
  if (!draft) return;
  const simpleFields = [
    'invoiceRecordId',
    'invoiceNo',
    'invoiceDate',
    'paymentTerms',
    'clientName',
    'clientEmail',
    'clientAddress',
    'clientPhone',
    'discount',
    'shipping',
    'invoiceNotes'
  ];
  simpleFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = draft[id] ?? '';
  });
  if (draft.currency && document.getElementById('currency')) {
    document.getElementById('currency').value = draft.currency;
  }
  invoiceItems.splice(0, invoiceItems.length, ...(draft.items || []));
  M.FormSelect.init(document.querySelectorAll('select'));
  M.updateTextFields();
  renderItemTable();
  setDirtyState(false);
  showValidationBanner([]);
}

async function loadInvoiceFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const invoiceId = params.get('invoiceId');
  if (!invoiceId) return;

  try {
    const result = await window.Api.getInvoice(invoiceId);
    if (result?.invoice?.payload) {
      const payload = { ...result.invoice.payload, invoiceRecordId: result.invoice.id };
      applyInvoiceState(payload);
      M.toast({ html: `Loaded invoice ${result.invoice.invoiceNo || ''}`.trim() });
    }
  } catch (err) {
    M.toast({ html: err.message || 'Failed to load invoice' });
  }
}

function renderDraftList() {
  const list = document.getElementById('draftList');
  if (!list) return;
  list.innerHTML = '';
  const drafts = loadDrafts().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (!drafts.length) {
    list.innerHTML = '<li class="collection-item grey-text">No drafts yet. Save a draft to continue later.</li>';
    return;
  }

  drafts.slice(0, 8).forEach((draft) => {
    const li = document.createElement('li');
    li.className = 'collection-item';
    const left = document.createElement('div');
    left.innerHTML = `<strong>${draft.invoiceNo || draft.id}</strong><div class="draft-item-meta">Updated ${new Date(draft.updatedAt).toLocaleString()}</div>`;
    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '0.35rem';
    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn-small';
    loadBtn.type = 'button';
    loadBtn.textContent = 'Load';
    loadBtn.addEventListener('click', () => applyInvoiceState(draft));
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-small secondary';
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      const next = loadDrafts().filter((d) => d.id !== draft.id);
      saveDrafts(next);
      renderDraftList();
    });
    right.appendChild(loadBtn);
    right.appendChild(delBtn);
    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });
}

function saveCurrentDraft() {
  const draft = collectInvoiceState();
  const drafts = loadDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  if (idx >= 0) drafts[idx] = draft;
  else drafts.push(draft);
  saveDrafts(drafts);
  renderDraftList();
  setDirtyState(false);
  showValidationBanner([]);
  M.toast({ html: 'Draft saved' });
}

function initMobileAccordions() {
  // Disabled: dynamic DOM wrapping/collapse created unstable mobile behavior.
}

function collectCurrentItemFromForm() {
  clearFieldErrors();
  showValidationBanner([]);
  const serviceName = readInput('serviceName');
  const hsn = readInput('hsn');
  const serviceDesc = readInput('serviceDesc');
  const periodFrom = readInput('periodFrom');
  const periodTo = readInput('periodTo');
  const fromLabel = formatPeriodDate(periodFrom);
  const toLabel = formatPeriodDate(periodTo);
  const period = fromLabel && toLabel ? `[${fromLabel} - ${toLabel}]` : (fromLabel || toLabel || '');
  const qty = Number(document.getElementById('qty').value) || 0;
  const rate = Number(document.getElementById('rate').value) || 0;
  const taxPct = Number(document.getElementById('itemTax').value) || 0;

  if (!serviceName) {
    setFieldError('serviceName', 'Service name is required');
    showValidationBanner(['Service name is required']);
    return null;
  }
  if (qty <= 0) {
    setFieldError('qty', 'Quantity must be greater than 0');
    showValidationBanner(['Quantity must be greater than 0']);
    return null;
  }
  if (rate < 0 || taxPct < 0) {
    setFieldError('rate', 'Rate cannot be negative');
    setFieldError('itemTax', 'IGST cannot be negative');
    showValidationBanner(['Rate and IGST cannot be negative']);
    return null;
  }

  return { serviceName, hsn, serviceDesc, period, qty, rate, taxPct, amount: qty * rate };
}

function clearItemForm() {
  ['serviceName', 'hsn', 'serviceDesc', 'periodFrom', 'periodTo', 'qty', 'rate'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.getElementById('itemTax').value = document.getElementById('itemTax').value || '0';
  const serviceSelect = document.getElementById('serviceSelect');
  if (serviceSelect) {
    serviceSelect.value = '';
    M.FormSelect.init(serviceSelect);
  }
  M.updateTextFields();
}

function addInvoiceItem() {
  const item = collectCurrentItemFromForm();
  if (!item) return;
  invoiceItems.push(item);
  clearItemForm();
  renderItemTable();
  setDirtyState(true);
}

function removeInvoiceItem(index) {
  invoiceItems.splice(index, 1);
  renderItemTable();
  setDirtyState(true);
}

function computeTotals() {
  const discount = Number(document.getElementById('discount').value) || 0;
  const shipping = Number(document.getElementById('shipping').value) || 0;
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const igstTax = invoiceItems.reduce((sum, item) => sum + (item.amount * item.taxPct) / 100, 0);
  return {
    subtotal,
    igstTax,
    discount,
    shipping,
    grandTotal: Math.max(0, subtotal + igstTax + shipping - discount)
  };
}

function renderSummary() {
  const totals = computeTotals();
  document.getElementById('summarySubtotal').textContent = formatMoney(totals.subtotal);
  document.getElementById('summaryTax').textContent = formatMoney(totals.igstTax);
  document.getElementById('summaryDiscount').textContent = formatMoney(totals.discount);
  document.getElementById('summaryShipping').textContent = formatMoney(totals.shipping);
  document.getElementById('summaryTotal').textContent = formatMoney(totals.grandTotal);
}

function renderItemTable() {
  const tbody = document.getElementById('itemTableBody');
  tbody.innerHTML = '';

  if (!invoiceItems.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="center-align grey-text">No line items yet. Add an item above to begin your invoice.</td></tr>';
    renderSummary();
    return;
  }

  invoiceItems.forEach((item, index) => {
    const displayPeriod = normalizeServicePeriod(item.period);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${item.serviceName}</strong>${item.hsn ? `<br>HSN: ${item.hsn}` : ''}${item.serviceDesc ? `<br>${item.serviceDesc}` : ''}${displayPeriod ? `<br>${displayPeriod}` : ''}</td>
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
  clearFieldErrors();
  const errors = [];
  const required = [
    ['invoiceNo', 'Invoice number is required'],
    ['invoiceDate', 'Invoice date is required'],
    ['clientName', 'Client name is required'],
    ['clientEmail', 'Client email is required'],
    ['clientAddress', 'Client address is required']
  ];

  for (const [id, message] of required) {
    if (!readInput(id)) {
      setFieldError(id, message);
      errors.push(message);
    }
  }

  if (!invoiceItems.length) {
    errors.push('Add at least one line item');
  }

  showValidationBanner(errors);
  if (errors.length) {
    const first = required.find(([id]) => !readInput(id));
    if (first) document.getElementById(first[0]).focus();
    return false;
  }
  return true;
}

async function generatePDF(previewOnly = false) {
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
    const bankAddress = String(settings.bankAddress || '').trim();
    const bankAcct = settings.bankAccount || 'Account number not configured';
    const bankHolder = settings.bankHolder || 'Account holder not configured';
    const bankSwift = settings.bankSwift || 'Code not configured';
    const bankUpi = String(settings.bankUpi || '').trim();
    const payableTo = settings.payableTo || bankHolder;
    const displayInvoiceNo = buildDisplayInvoiceNo(settings.invoicePrefix, invoiceNo);

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
    const invoiceLabel = 'Invoice # : ';
    doc.setFont('helvetica', 'bold');
    const invoiceValueWidth = doc.getTextWidth(displayInvoiceNo);
    doc.text(displayInvoiceNo, rightX, invY - 2, null, null, 'right');
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceLabel, rightX - invoiceValueWidth, invY - 2, null, null, 'right');
    doc.text(`Invoice Date : ${invoiceDate}`, rightX, invY + 2, null, null, 'right');
    let invoiceMetaY = invY + 6;
    if (dueDate) {
      doc.text(`Due Date : ${dueDate}`, rightX, invoiceMetaY, null, null, 'right');
      invoiceMetaY += 8; // one blank line before currency
    } else {
      invoiceMetaY += 4;
    }
    doc.text(`Currency : ${getCurrency()}`, rightX, invoiceMetaY, null, null, 'right');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', 20, invY);
    let billY = invY + 5;
    doc.text(client, 20, billY);
    doc.setFont('helvetica', 'normal');
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
      const displayPeriod = normalizeServicePeriod(item.period);
      return [
        `${index + 1}`,
        `${item.serviceName}\nHSN: ${item.hsn || '-'}${item.serviceDesc ? `\n${item.serviceDesc}` : ''}${displayPeriod ? `\n${displayPeriod}` : ''}`,
        item.qty.toString(),
        item.rate.toFixed(2),
        { taxAmount: taxAmount.toFixed(2), taxPct: item.taxPct.toFixed(2) },
        item.amount.toFixed(2)
      ];
    });

    doc.autoTable({
      startY: billY + 8,
      margin: { left: 20, right: 20 },
      head: [[
        'Sr No.',
        'Product/Services',
        'Qty',
        'Rate',
        'Tax',
        'Amount'
      ]],
      body: tableBody,
      styles: { fontSize: 9, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 70, 136], textColor: 255 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 15 },
        1: { cellWidth: 79 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 24 }
      },
      didParseCell: (data) => {
        if (data.section === 'head' && [2, 3, 4, 5].includes(data.column.index)) {
          data.cell.styles.halign = 'right';
        }
        if (data.section === 'body' && data.column.index === 1 && typeof data.cell.raw === 'string') {
          const lines = String(data.cell.raw).split('\n');
          const firstLine = lines.shift() || '';
          data.cell.raw = { firstLine, restLines: lines };
          data.cell.text = ['', ...lines]; // reserve first row for custom bold line
          data.cell.styles.fontStyle = 'normal';
          data.cell.styles.valign = 'top';
        }
        if (data.section === 'body' && ![1, 4].includes(data.column.index)) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.section === 'body' && data.column.index === 4 && data.cell.raw && typeof data.cell.raw === 'object') {
          data.cell.text = [''];
          data.cell.styles.valign = 'top';
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 1 && data.cell.raw && data.cell.raw.firstLine !== undefined) {
          const padX = 1.5;
          const textX = data.cell.x + padX;
          const maxW = Math.max(0, data.cell.width - padX * 2);
          const firstLine = String(data.cell.raw.firstLine || '');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(firstLine, textX, data.cell.y + 4.4, { maxWidth: maxW });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          return;
        }

        if (data.section !== 'body' || data.column.index !== 4 || !data.cell.raw || typeof data.cell.raw !== 'object') return;

        const pad = 1.5;
        const rightX = data.cell.x + data.cell.width - pad;
        const leftX = data.cell.x + pad;
        const maxW = Math.max(0, data.cell.width - pad * 2);
        const amountText = String(data.cell.raw.taxAmount);
        const igstText = `IGST:${data.cell.raw.taxPct}%`;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(amountText, rightX, data.cell.y + 4.4, { align: 'right', maxWidth: maxW });

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.text(igstText, rightX, data.cell.y + 7.6, { align: 'right', maxWidth: maxW });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      },
      theme: 'grid'
    });

    const totals = computeTotals();
    const finalY = doc.lastAutoTable.finalY + 6;
    const effectiveIgstRate = totals.subtotal > 0 ? (totals.igstTax / totals.subtotal) * 100 : 0;
    const totalBeforeGrand = Math.max(0, totals.subtotal + totals.igstTax);
    const hasShipping = totals.shipping > 0;
    const hasDiscount = totals.discount > 0;
    const labelLeftX = 128;
    const valueRightX = 190;
    doc.setFontSize(9);

    doc.text('Base Amount', labelLeftX, finalY);
    doc.text(formatMoney(totals.subtotal), valueRightX, finalY, null, null, 'right');
    doc.text(`(+) IGST`, labelLeftX, finalY + 6);
    doc.text(formatMoney(totals.igstTax), valueRightX, finalY + 6, null, null, 'right');
    doc.setFont('helvetica', 'bold');
    doc.text('Total', labelLeftX, finalY + 12);
    doc.text(formatMoney(totalBeforeGrand), valueRightX, finalY + 12, null, null, 'right');
    doc.setFont('helvetica', 'normal');

    let extraY = finalY + 18;
    if (hasShipping) {
      doc.text('(+) Shipping / Additional', labelLeftX, extraY);
      doc.text(formatMoney(totals.shipping), valueRightX, extraY, null, null, 'right');
      extraY += 6;
    }
    if (hasDiscount) {
      doc.text('(-) Discount (Flat)', labelLeftX, extraY);
      doc.text(formatMoney(totals.discount), valueRightX, extraY, null, null, 'right');
      extraY += 6;
    }

    const grandRectY = extraY - 4;
    const grandTextY = extraY;

    doc.setFillColor(0, 70, 136);
    doc.rect(labelLeftX, grandRectY, valueRightX - labelLeftX, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Grand Total', labelLeftX, grandTextY);
    doc.text(formatMoney(totals.grandTotal), valueRightX, grandTextY, null, null, 'right');
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(9);
    doc.text('Please Note', 20, finalY + 10);
    doc.setFontSize(8);
    const composedNotes = notes || settings.defaultNotes || 'Thank you for your business.';
    doc.text(composedNotes, 20, finalY + 15, { maxWidth: 110 });

    const boxY = grandTextY + 16;
    const bankDetailLines = [
      `BANK NAME: ${bankName}`,
      `ACCOUNT NAME: ${bankHolder}`,
      `ACCOUNT NUMBER: ${bankAcct}`,
      `SWIFT CODE: ${bankSwift}`,
      bankUpi ? `UPI ID: ${bankUpi}` : ''
    ].filter(Boolean);
    if (bankAddress) bankDetailLines.push(`BANK ADDRESS: ${bankAddress}`);

    doc.setFontSize(9);
    const wrappedBankLines = [];
    bankDetailLines.forEach((line) => {
      const chunks = doc.splitTextToSize(line, 76);
      wrappedBankLines.push(...chunks);
    });
    const bankBoxHeight = Math.max(36, 10 + wrappedBankLines.length * 4 + 2);

    doc.rect(20, boxY, 82, bankBoxHeight);
    doc.rect(108, boxY, 82, bankBoxHeight);

=======
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
=======
function getSettings() {
  const raw = localStorage.getItem('invoiceSettings');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('invalid settings', e);
    return {};
>>>>>>> theirs
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
<<<<<<< ours
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
    doc.text(`Invoice # : ${displayInvoiceNo}`, rightX, invY - 2, null, null, 'right');
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
>>>>>>> theirs
    doc.text('Payable To', 22, boxY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(payableTo, 22, boxY + 12);
    doc.setFont('helvetica', 'normal');
<<<<<<< ours
    doc.text('Bank Details', 110, boxY + 5);

    let bankLineY = boxY + 10;
    wrappedBankLines.forEach((line) => {
      doc.text(line, 110, bankLineY);
      bankLineY += 4;
    });

    const signBoxY = boxY + bankBoxHeight + 4;
    doc.text(`For ${name}`, 190, signBoxY + 10, null, null, 'right');
    doc.text(settings.signatoryName || 'Authorized Signatory', 190, signBoxY + 24, null, null, 'right');
    doc.text('(Authorised Signatory)', 190, signBoxY + 29, null, null, 'right');
=======
    doc.text('Bank Details', 112, boxY + 5);
    doc.text(`BANK NAME: ${bankName}`, 112, boxY + 10);
    doc.text(`ACCOUNT HOLDER NAME: ${bankHolder}`, 112, boxY + 14);
    doc.text(`ACCOUNT NUMBER: ${bankAcct}`, 112, boxY + 18);
    doc.text(`SWIFT CODE: ${bankSwift}`, 112, boxY + 22);
    doc.text(`UPI ID: ${bankUpi}`, 112, boxY + 26);

    doc.text(settings.signatoryName || 'Authorized Signatory', 145, boxY + 40);
    doc.text('Signature', 150, boxY + 46);
>>>>>>> theirs
=======
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
    // same 4‑point gap as between invoice # and invoice date
    doc.text(`Due Date : ${dueDate}`, rightX, invY + 6, null, null, 'right');
  }
>>>>>>> theirs

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
      { content: 'Sr No.', styles: { halign: 'center' } },
      'Services',
      { content: 'Qty', styles: { halign: 'right' } },
      { content: 'Rate', styles: { halign: 'right' } },
      { content: 'Tax', styles: { halign: 'right' } },
      { content: 'Amount', styles: { halign: 'right' } }
    ]],
    body: [[
      '1',
      service + '\nHSN Code : ' + hsn + (serviceDesc ? '\n' + serviceDesc : '') + '\n' + period,
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

<<<<<<< ours
<<<<<<< ours
    try {
      const saved = await window.Api.saveInvoice(buildInvoicePersistPayload());
      if (saved?.id) {
        const hiddenId = document.getElementById('invoiceRecordId');
        if (hiddenId) hiddenId.value = saved.id;
      }
    } catch (saveErr) {
      console.error('invoice save failed', saveErr);
      M.toast({ html: 'PDF generated, but failed to save invoice record' });
    }

    doc.save(`Invoice_${displayInvoiceNo}.pdf`);
    setDirtyState(false);
=======
    doc.save(`Invoice_${displayInvoiceNo}.pdf`);
>>>>>>> theirs
=======
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
>>>>>>> theirs
  } catch (err) {
    console.error('generatePDF error', err);
    alert('Failed to generate PDF: ' + err.message);
  }
}

<<<<<<< ours
<<<<<<< ours
window.addEventListener('DOMContentLoaded', async () => {
  const ok = await window.Auth.requireAuth();
  if (!ok) return;

  try {
    await bootstrapRemoteData();
  } catch (err) {
    console.error('bootstrap failed', err);
    M.toast({ html: 'Failed to load your account data' });
  }

=======
=======
// initialize client selector when page loads
>>>>>>> theirs
window.addEventListener('DOMContentLoaded', () => {
>>>>>>> theirs
  populateClientDropdown();
  const sel = document.getElementById('clientSelect');
  if (sel) {
    sel.addEventListener('change', () => {
      fillClientFields(sel.value);
    });
  }
  populateServiceDropdown();
<<<<<<< ours

  const settings = getSettings();
  if (settings.defaultCurrency) document.getElementById('currency').value = settings.defaultCurrency;
  if (settings.defaultTaxPct !== undefined) document.getElementById('itemTax').value = settings.defaultTaxPct;
  if (settings.defaultPaymentTerms !== undefined) document.getElementById('paymentTerms').value = settings.defaultPaymentTerms;
  if (settings.defaultNotes) document.getElementById('invoiceNotes').value = settings.defaultNotes;
<<<<<<< ours
  renderInvoicePrefixInline(settings);
  renderDraftList();
  setDirtyState(false);
  initMobileAccordions();
=======
>>>>>>> theirs

  document.getElementById('clientSelect')?.addEventListener('change', (e) => fillClientFields(e.target.value));
  document.getElementById('serviceSelect')?.addEventListener('change', (e) => fillServiceFields(e.target.value));
  document.getElementById('addItem').addEventListener('click', addInvoiceItem);
<<<<<<< ours
  document.getElementById('saveDraftBtn')?.addEventListener('click', saveCurrentDraft);
  window.addEventListener('resize', () => {
    renderInvoicePrefixInline(getSettings());
    initMobileAccordions();
  });

  document.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('input', () => setDirtyState(true));
    el.addEventListener('change', () => setDirtyState(true));
  });
=======
>>>>>>> theirs

  ['discount', 'shipping', 'currency'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderSummary);
  });

  M.FormSelect.init(document.querySelectorAll('select'));
  M.updateTextFields();
  renderItemTable();
<<<<<<< ours
  await loadInvoiceFromQuery();
});

async function previewPDF() {
  await generatePDF(true);
=======
});

function previewPDF() {
  generatePDF(true);
>>>>>>> theirs
}

window.generatePDF = generatePDF;
window.previewPDF = previewPDF;
=======
  const srvSel = document.getElementById('serviceSelect');
  if (srvSel) {
    srvSel.addEventListener('change', () => {
      fillServiceFields(srvSel.value);
    });
  }
});

// expose globally just in case
window.generatePDF = generatePDF;
>>>>>>> theirs
