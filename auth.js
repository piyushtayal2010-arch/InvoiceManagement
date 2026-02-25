(function () {
  const TOKEN_KEY = 'invoiceAuthToken';
  const USER_KEY = 'invoiceAuthUser';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('invoiceClients');
    localStorage.removeItem('invoiceServices');
    localStorage.removeItem('invoiceSettings');
    localStorage.removeItem('invoiceDrafts');
  }

  async function authFetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!headers['Content-Type'] && options.body) headers['Content-Type'] = 'application/json';

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      clearSession();
      if (!location.pathname.endsWith('login.html')) {
        location.href = 'login.html';
      }
      throw new Error('Unauthorized');
    }
    return response;
  }

  async function requireAuth() {
    const token = getToken();
    if (!token) {
      if (!location.pathname.endsWith('login.html')) location.href = 'login.html';
      return false;
    }

    try {
      const res = await authFetch('/api/auth/me');
      if (!res.ok) throw new Error('Invalid session');
      return true;
    } catch {
      clearSession();
      if (!location.pathname.endsWith('login.html')) location.href = 'login.html';
      return false;
    }
  }

  function logout() {
    clearSession();
    location.href = 'login.html';
  }

  window.Auth = {
    getToken,
    getUser,
    setSession,
    clearSession,
    authFetch,
    requireAuth,
    logout
  };
})();
