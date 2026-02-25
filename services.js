let servicesCache = [];

function populateList() {
  const list = document.getElementById('serviceList');
  if (!list) return;
  list.innerHTML = '';

  servicesCache.forEach((s) => {
    const item = document.createElement('li');
    item.className = 'collection-item';
    item.innerHTML = `
      <span class="title"><strong>${s.name}</strong> (HSN: ${s.hsn || ''})</span>
      <p>${s.desc || ''}</p>
      <a href="#" class="secondary-content edit"><i class="material-icons">edit</i></a>
      <a href="#" class="secondary-content delete" style="margin-right:1rem;"><i class="material-icons red-text">delete</i></a>
    `;

    item.querySelector('.edit').addEventListener('click', (e) => {
      e.preventDefault();
      fillForm(s);
    });

    item.querySelector('.delete').addEventListener('click', async (e) => {
      e.preventDefault();
      if (!confirm('Remove service?')) return;
      try {
        await window.Api.deleteService(s.id);
        servicesCache = servicesCache.filter((x) => x.id !== s.id);
        populateList();
      } catch (err) {
        M.toast({ html: err.message || 'Delete failed' });
      }
    });

    list.appendChild(item);
  });
}

function fillForm(s) {
  document.getElementById('serviceName').value = s.name || '';
  document.getElementById('serviceHsn').value = s.hsn || '';
  document.getElementById('serviceDesc').value = s.desc || '';
  const saveBtn = document.getElementById('saveService');
  if (saveBtn) saveBtn.dataset.editId = s.id || '';
  M.updateTextFields();
}

function clearForm() {
  document.getElementById('serviceName').value = '';
  document.getElementById('serviceHsn').value = '';
  document.getElementById('serviceDesc').value = '';
  const saveBtn = document.getElementById('saveService');
  if (saveBtn) saveBtn.dataset.editId = '';
  M.updateTextFields();
}

window.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('serviceList')) return;

  const ok = await window.Auth.requireAuth();
  if (!ok) return;

  try {
    servicesCache = await window.Api.getServices();
    populateList();
  } catch (err) {
    M.toast({ html: err.message || 'Failed to load services' });
  }

  document.getElementById('saveService').addEventListener('click', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveService');
    const service = {
      id: saveBtn.dataset.editId || undefined,
      name: document.getElementById('serviceName').value.trim(),
      hsn: document.getElementById('serviceHsn').value.trim(),
      desc: document.getElementById('serviceDesc').value.trim()
    };

    if (!service.name || !service.hsn) {
      M.toast({ html: 'Name and HSN code required' });
      return;
    }

    try {
      const saved = await window.Api.saveService(service);
      const idx = servicesCache.findIndex((x) => x.id === saved.id || x.name === saved.name);
      if (idx >= 0) servicesCache[idx] = { ...service, id: saved.id };
      else servicesCache.push({ ...service, id: saved.id });
      populateList();
      clearForm();
      M.toast({ html: 'Service saved' });
    } catch (err) {
      M.toast({ html: err.message || 'Save failed' });
    }
  });

  document.getElementById('clearService').addEventListener('click', (e) => {
    e.preventDefault();
    clearForm();
  });
});
