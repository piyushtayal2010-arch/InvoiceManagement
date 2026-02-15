// clients.js manages a list of clients in localStorage
const CLIENTS_KEY = 'invoiceClients';

function loadClients() {
  const raw = localStorage.getItem(CLIENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('clients parse error', e);
    return [];
  }
}

function saveClients(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function addOrUpdateClient(client) {
  const clients = loadClients();
  const idx = clients.findIndex(c => c.email === client.email); // use email as unique key
  if (idx >= 0) {
    clients[idx] = client;
  } else {
    clients.push(client);
  }
  saveClients(clients);
}

function deleteClient(email) {
  let clients = loadClients();
  clients = clients.filter(c => c.email !== email);
  saveClients(clients);
}

function populateList() {
  const list = document.getElementById('clientList');
  list.innerHTML = '';
  loadClients().forEach(c => {
    const item = document.createElement('li');
    item.className = 'collection-item';
    item.innerHTML = `
      <span class="title"><strong>${c.name}</strong> (${c.email})</span>
      <p>${c.address.replace(/\n/g,'<br>')}<br>Phone: ${c.phone}<br>Terms: ${c.terms}</p>
      <a href="#" class="secondary-content edit"><i class="material-icons">edit</i></a>
      <a href="#" class="secondary-content delete" style="margin-right:1rem;"><i class="material-icons red-text">delete</i></a>
    `;
    // attach handlers
    item.querySelector('.edit').addEventListener('click', e => {
      e.preventDefault();
      fillForm(c);
    });
    item.querySelector('.delete').addEventListener('click', e => {
      e.preventDefault();
      if (confirm('Remove client?')) {
        deleteClient(c.email);
        populateList();
      }
    });
    list.appendChild(item);
  });
}

function fillForm(c) {
  document.getElementById('clientName').value = c.name;
  document.getElementById('clientEmail').value = c.email;
  document.getElementById('clientPhone').value = c.phone;
  document.getElementById('clientAddress').value = c.address;
  document.getElementById('clientTerms').value = c.terms;
  M.updateTextFields();
}

function clearForm() {
  document.getElementById('clientName').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('clientAddress').value = '';
  document.getElementById('clientTerms').value = '';
  M.updateTextFields();
}

window.addEventListener('DOMContentLoaded', () => {
  populateList();
  document.getElementById('saveClient').addEventListener('click', e => {
    e.preventDefault();
    const client = {
      name: document.getElementById('clientName').value,
      email: document.getElementById('clientEmail').value,
      phone: document.getElementById('clientPhone').value,
      address: document.getElementById('clientAddress').value,
      terms: document.getElementById('clientTerms').value
    };
    if (!client.name || !client.email) {
      M.toast({html: 'Name and email required'});
      return;
    }
    addOrUpdateClient(client);
    populateList();
    clearForm();
    M.toast({html: 'Client saved'});
  });
  document.getElementById('clearClient').addEventListener('click', e => {
    e.preventDefault();
    clearForm();
  });
});