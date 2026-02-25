(function () {
  async function parseJson(response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async function request(url, options = {}) {
    const response = await window.Auth.authFetch(url, options);
    const data = await parseJson(response);
    if (!response.ok) {
      const message = (data && data.error) || `Request failed (${response.status})`;
      throw new Error(message);
    }
    return data;
  }

  window.Api = {
    register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    me: () => request('/api/auth/me'),
    getProfile: () => request('/api/profile'),
    saveProfile: (payload) => request('/api/profile', { method: 'PUT', body: JSON.stringify(payload) }),
    bootstrap: () => request('/api/bootstrap'),

    getSettings: () => request('/api/settings'),
    saveSettings: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }),

    getClients: () => request('/api/clients'),
    saveClient: (payload) => request('/api/clients', { method: 'POST', body: JSON.stringify(payload) }),
    deleteClient: (id) => request(`/api/clients/${id}`, { method: 'DELETE' }),

    getServices: () => request('/api/services'),
    saveService: (payload) => request('/api/services', { method: 'POST', body: JSON.stringify(payload) }),
    deleteService: (id) => request(`/api/services/${id}`, { method: 'DELETE' }),

    getDrafts: () => request('/api/drafts'),
    replaceDrafts: (drafts) => request('/api/drafts', { method: 'PUT', body: JSON.stringify({ drafts }) }),

    getInvoices: () => request('/api/invoices'),
    getInvoice: (id) => request(`/api/invoices/${id}`),
    saveInvoice: (payload) => request('/api/invoices', { method: 'POST', body: JSON.stringify(payload) }),
    deleteInvoice: (id) => request(`/api/invoices/${id}`, { method: 'DELETE' })
  };
})();
