// services.js manages a list of services in localStorage
const SERVICES_KEY = 'invoiceServices';

function loadServices() {
  const raw = localStorage.getItem(SERVICES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('services parse error', e);
    return [];
  }
}

function saveServices(services) {
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
}

function addOrUpdateService(service) {
  const services = loadServices();
  const idx = services.findIndex(s => s.name === service.name); // use name as unique key
  if (idx >= 0) {
    services[idx] = service;
  } else {
    services.push(service);
  }
  saveServices(services);
}

function deleteService(name) {
  let services = loadServices();
  services = services.filter(s => s.name !== name);
  saveServices(services);
}

function populateList() {
  const list = document.getElementById('serviceList');
  list.innerHTML = '';
  loadServices().forEach(s => {
    const item = document.createElement('li');
    item.className = 'collection-item';
    item.innerHTML = `
      <span class="title"><strong>${s.name}</strong> (HSN: ${s.hsn})</span>
      <p>${s.desc}</p>
      <a href="#" class="secondary-content edit"><i class="material-icons">edit</i></a>
      <a href="#" class="secondary-content delete" style="margin-right:1rem;"><i class="material-icons red-text">delete</i></a>
    `;
    // attach handlers
    item.querySelector('.edit').addEventListener('click', e => {
      e.preventDefault();
      fillForm(s);
    });
    item.querySelector('.delete').addEventListener('click', e => {
      e.preventDefault();
      if (confirm('Remove service?')) {
        deleteService(s.name);
        populateList();
      }
    });
    list.appendChild(item);
  });
}

function fillForm(s) {
  document.getElementById('serviceName').value = s.name;
  document.getElementById('serviceHsn').value = s.hsn;
  document.getElementById('serviceDesc').value = s.desc;
  M.updateTextFields();
}

function clearForm() {
  document.getElementById('serviceName').value = '';
  document.getElementById('serviceHsn').value = '';
  document.getElementById('serviceDesc').value = '';
  M.updateTextFields();
}

window.addEventListener('DOMContentLoaded', () => {
  populateList();
  document.getElementById('saveService').addEventListener('click', e => {
    e.preventDefault();
    const service = {
      name: document.getElementById('serviceName').value,
      hsn: document.getElementById('serviceHsn').value,
      desc: document.getElementById('serviceDesc').value
    };
    if (!service.name || !service.hsn) {
      M.toast({html: 'Name and HSN code required'});
      return;
    }
    addOrUpdateService(service);
    populateList();
    clearForm();
    M.toast({html: 'Service saved'});
  });
  document.getElementById('clearService').addEventListener('click', e => {
    e.preventDefault();
    clearForm();
  });
});