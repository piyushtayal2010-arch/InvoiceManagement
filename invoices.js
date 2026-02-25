function formatCurrency(amount, code) {
  const num = Number(amount || 0);
  return `${code || 'CAD'} ${num.toFixed(2)}`;
}

function renderRows(invoices) {
  const tbody = document.getElementById('invoiceHistoryBody');
  if (!tbody) return;

  if (!invoices.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="center-align grey-text">No past invoices yet.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  invoices.forEach((inv) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inv.invoiceNo || '-'}</td>
      <td>${inv.invoiceDate || '-'}</td>
      <td>${inv.clientName || '-'}</td>
      <td>${formatCurrency(inv.grandTotal, inv.currency)}</td>
      <td>${inv.status || 'sent'}</td>
      <td>
        <button class="btn-small secondary open-btn" type="button">Open</button>
        <button class="btn-small red delete-btn" type="button">Delete</button>
      </td>
    `;

    tr.querySelector('.open-btn').addEventListener('click', () => {
      location.href = `index.html?invoiceId=${encodeURIComponent(inv.id)}`;
    });

    tr.querySelector('.delete-btn').addEventListener('click', async () => {
      if (!confirm('Delete this invoice record?')) return;
      try {
        await window.Api.deleteInvoice(inv.id);
        tr.remove();
        if (!tbody.children.length) {
          tbody.innerHTML = '<tr><td colspan="6" class="center-align grey-text">No past invoices yet.</td></tr>';
        }
      } catch (err) {
        M.toast({ html: err.message || 'Delete failed' });
      }
    });

    tbody.appendChild(tr);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const ok = await window.Auth.requireAuth();
  if (!ok) return;

  try {
    const invoices = await window.Api.getInvoices();
    renderRows(invoices || []);
  } catch (err) {
    M.toast({ html: err.message || 'Failed to load invoices' });
    renderRows([]);
  }
});
