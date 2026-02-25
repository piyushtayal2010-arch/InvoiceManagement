let clientsCache = [];

function populateList() {
  const list = document.getElementById('clientList');
  if (!list) return;
  list.innerHTML = '';

  clientsCache.forEach((c) => {
    const item = document.createElement('li');
    item.className = 'collection-item';
    item.innerHTML = `
      <span class="title"><strong>${c.name}</strong> (${c.email})</span>
      <p>${String(c.address || '').replace(/\n/g, '<br>')}<br>Phone: ${c.phone || ''}<br>Terms: ${c.terms || ''}</p>
      <a href="#" class="secondary-content edit"><i class="material-icons">edit</i></a>
      <a href="#" class="secondary-content delete" style="margin-right:1rem;"><i class="material-icons red-text">delete</i></a>
    `;

    item.querySelector('.edit').addEventListener('click', (e) => {
      e.preventDefault();
      fillForm(c);
    });

    item.querySelector('.delete').addEventListener('click', async (e) => {
      e.preventDefault();
      if (!confirm('Remove client?')) return;
      try {
        await window.Api.deleteClient(c.id);
        clientsCache = clientsCache.filter((x) => x.id !== c.id);
        populateList();
      } catch (err) {
        M.toast({ html: err.message || 'Delete failed' });
      }
    });

    list.appendChild(item);
  });
}

function fillForm(c) {
  document.getElementById('clientName').value = c.name || '';
  document.getElementById('clientEmail').value = c.email || '';
  document.getElementById('clientPhone').value = c.phone || '';
  document.getElementById('clientAddress').value = c.address || '';
  document.getElementById('clientTerms').value = c.terms || '';
  const form = document.getElementById('saveClient');
  if (form) form.dataset.editId = c.id || '';
  M.updateTextFields();
}

function clearForm() {
  document.getElementById('clientName').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('clientAddress').value = '';
  document.getElementById('clientTerms').value = '';
  const saveBtn = document.getElementById('saveClient');
  if (saveBtn) saveBtn.dataset.editId = '';
  M.updateTextFields();
}

window.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('clientList')) return;

  const ok = await window.Auth.requireAuth();
  if (!ok) return;

  try {
    clientsCache = await window.Api.getClients();
    populateList();
  } catch (err) {
    M.toast({ html: err.message || 'Failed to load clients' });
  }

  document.getElementById('saveClient').addEventListener('click', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveClient');
    const client = {
      id: saveBtn.dataset.editId || undefined,
      name: document.getElementById('clientName').value.trim(),
      email: document.getElementById('clientEmail').value.trim(),
      phone: document.getElementById('clientPhone').value.trim(),
      address: document.getElementById('clientAddress').value.trim(),
      terms: document.getElementById('clientTerms').value.trim()
    };

    if (!client.name || !client.email) {
      M.toast({ html: 'Name and email required' });
      return;
    }

    try {
      const saved = await window.Api.saveClient(client);
      const idx = clientsCache.findIndex((x) => x.id === saved.id || x.email === saved.email);
      if (idx >= 0) clientsCache[idx] = { ...client, id: saved.id };
      else clientsCache.push({ ...client, id: saved.id });
      populateList();
      clearForm();
      M.toast({ html: 'Client saved' });
    } catch (err) {
      M.toast({ html: err.message || 'Save failed' });
    }
  });

  document.getElementById('clearClient').addEventListener('click', (e) => {
    e.preventDefault();
    clearForm();
  });
});
