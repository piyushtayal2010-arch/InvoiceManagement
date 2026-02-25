const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const { initSheets, readTable, upsertRow, deleteRows } = require('./sheets-store');
const { signToken, requireAuth } = require('./auth');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '1mb' }));

function mustGetEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

function nowIso() {
  return new Date().toISOString();
}

function asBoolean(value) {
  return String(value).toLowerCase() === 'true';
}

function serializeUser(user) {
  if (!user) return null;
  return {
    userId: user.user_id,
    email: user.email,
    fullName: user.full_name || '',
    country: user.country || ''
  };
}

function serializeSettings(rows, userId) {
  const row = rows.find((r) => r.user_id === userId);
  if (!row) return {};
  const out = { ...row };
  delete out.settings_id;
  delete out.user_id;
  delete out.updated_at;
  delete out.__rowNumber;
  out.defaultTaxPct = Number(out.defaultTaxPct || 0);
  out.defaultPaymentTerms = Number(out.defaultPaymentTerms || 0);
  return out;
}

function serializeClients(rows, userId) {
  return rows
    .filter((r) => r.user_id === userId && !asBoolean(r.is_deleted || 'false'))
    .map((r) => ({
      id: r.client_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      terms: r.terms
    }));
}

function serializeServices(rows, userId) {
  return rows
    .filter((r) => r.user_id === userId && !asBoolean(r.is_deleted || 'false'))
    .map((r) => ({
      id: r.service_id,
      name: r.name,
      hsn: r.hsn,
      desc: r.desc
    }));
}

function serializeDrafts(rows, userId) {
  return rows
    .filter((r) => r.user_id === userId)
    .map((r) => {
      try {
        return JSON.parse(r.payload_json);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function serializeInvoices(rows, userId) {
  return rows
    .filter((r) => r.user_id === userId && !asBoolean(r.is_deleted || 'false'))
    .map((r) => ({
      id: r.invoice_id,
      invoiceNo: r.invoice_no,
      invoiceDate: r.invoice_date,
      clientName: r.client_name,
      clientEmail: r.client_email,
      currency: r.currency,
      grandTotal: Number(r.grand_total || 0),
      status: r.status || 'sent',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

app.post('/api/auth/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const fullName = String(req.body.fullName || '').trim();
  const country = String(req.body.country || '').trim();

  if (!email || !password || !fullName || !country) {
    return res.status(400).json({ error: 'Email, password, full name and country are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const users = await readTable('users');
  const existing = users.find((u) => String(u.email).toLowerCase() === email);
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    user_id: uuidv4(),
    email,
    password_hash: passwordHash,
    full_name: fullName,
    country,
    is_active: 'true',
    created_at: nowIso(),
    updated_at: nowIso(),
    last_login_at: ''
  };

  await upsertRow('users', 'user_id', user);

  const token = signToken(user);
  return res.status(201).json({
    token,
    user: serializeUser(user)
  });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = await readTable('users');
  const user = users.find((u) => String(u.email).toLowerCase() === email && asBoolean(u.is_active || 'true'));
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  user.last_login_at = nowIso();
  user.updated_at = nowIso();
  await upsertRow('users', 'user_id', user);

  const token = signToken(user);
  return res.json({ token, user: serializeUser(user) });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const users = await readTable('users');
  const user = users.find((u) => u.user_id === req.user.userId && asBoolean(u.is_active || 'true'));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: serializeUser(user) });
});

app.get('/api/profile', requireAuth, async (req, res) => {
  const users = await readTable('users');
  const user = users.find((u) => u.user_id === req.user.userId && asBoolean(u.is_active || 'true'));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: serializeUser(user) });
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const fullName = String(req.body.fullName || '').trim();
  const country = String(req.body.country || '').trim();
  if (!fullName || !country) {
    return res.status(400).json({ error: 'Full name and country are required' });
  }

  const users = await readTable('users');
  const user = users.find((u) => u.user_id === req.user.userId && asBoolean(u.is_active || 'true'));
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.full_name = fullName;
  user.country = country;
  user.updated_at = nowIso();
  await upsertRow('users', 'user_id', user);

  const token = signToken(user);
  res.json({ ok: true, token, user: serializeUser(user) });
});

app.get('/api/bootstrap', requireAuth, async (req, res) => {
  const [settingsRows, clientsRows, servicesRows, draftsRows] = await Promise.all([
    readTable('settings'),
    readTable('clients'),
    readTable('services'),
    readTable('drafts')
  ]);

  res.json({
    settings: serializeSettings(settingsRows, req.user.userId),
    clients: serializeClients(clientsRows, req.user.userId),
    services: serializeServices(servicesRows, req.user.userId),
    drafts: serializeDrafts(draftsRows, req.user.userId)
  });
});

app.get('/api/settings', requireAuth, async (req, res) => {
  const rows = await readTable('settings');
  return res.json(serializeSettings(rows, req.user.userId));
});

app.put('/api/settings', requireAuth, async (req, res) => {
  const payload = req.body || {};
  const rows = await readTable('settings');
  const idx = rows.findIndex((r) => r.user_id === req.user.userId);

  const base = {
    settings_id: idx >= 0 ? rows[idx].settings_id : uuidv4(),
    user_id: req.user.userId,
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    companyGstin: '',
    signatoryName: '',
    bankName: '',
    bankAddress: '',
    bankAccount: '',
    bankHolder: '',
    payableTo: '',
    bankSwift: '',
    bankUpi: '',
    defaultNotes: '',
    defaultCurrency: 'CAD',
    defaultTaxPct: 0,
    defaultPaymentTerms: 0,
    invoicePrefix: '',
    updated_at: nowIso()
  };

  const next = { ...base, ...(idx >= 0 ? rows[idx] : {}), ...payload, updated_at: nowIso() };
  next.defaultTaxPct = String(Number(next.defaultTaxPct || 0));
  next.defaultPaymentTerms = String(Number(next.defaultPaymentTerms || 0));

  await upsertRow('settings', 'user_id', next);
  return res.json({ ok: true });
});

app.get('/api/clients', requireAuth, async (req, res) => {
  const rows = await readTable('clients');
  res.json(serializeClients(rows, req.user.userId));
});

app.post('/api/clients', requireAuth, async (req, res) => {
  const payload = req.body || {};
  const rows = await readTable('clients');
  const now = nowIso();
  const id = payload.id || uuidv4();

  let idx = rows.findIndex((r) => r.client_id === id && r.user_id === req.user.userId);
  if (idx < 0 && payload.email) {
    idx = rows.findIndex((r) => r.user_id === req.user.userId && String(r.email).toLowerCase() === String(payload.email).toLowerCase());
  }

  const next = {
    client_id: idx >= 0 ? rows[idx].client_id : id,
    user_id: req.user.userId,
    name: String(payload.name || ''),
    email: String(payload.email || '').toLowerCase(),
    phone: String(payload.phone || ''),
    address: String(payload.address || ''),
    terms: String(payload.terms || ''),
    created_at: idx >= 0 ? rows[idx].created_at : now,
    updated_at: now,
    is_deleted: 'false'
  };

  await upsertRow('clients', 'client_id', next);
  res.json({ ...payload, id: next.client_id });
});

app.delete('/api/clients/:id', requireAuth, async (req, res) => {
  const rows = await readTable('clients');
  const idx = rows.findIndex((r) => r.user_id === req.user.userId && r.client_id === req.params.id);
  if (idx >= 0) {
    rows[idx].is_deleted = 'true';
    rows[idx].updated_at = nowIso();
    await upsertRow('clients', 'client_id', rows[idx]);
  }
  res.json({ ok: true });
});

app.get('/api/services', requireAuth, async (req, res) => {
  const rows = await readTable('services');
  res.json(serializeServices(rows, req.user.userId));
});

app.post('/api/services', requireAuth, async (req, res) => {
  const payload = req.body || {};
  const rows = await readTable('services');
  const now = nowIso();
  const id = payload.id || uuidv4();

  let idx = rows.findIndex((r) => r.service_id === id && r.user_id === req.user.userId);
  if (idx < 0 && payload.name) {
    idx = rows.findIndex((r) => r.user_id === req.user.userId && String(r.name).toLowerCase() === String(payload.name).toLowerCase());
  }

  const next = {
    service_id: idx >= 0 ? rows[idx].service_id : id,
    user_id: req.user.userId,
    name: String(payload.name || ''),
    hsn: String(payload.hsn || ''),
    desc: String(payload.desc || ''),
    created_at: idx >= 0 ? rows[idx].created_at : now,
    updated_at: now,
    is_deleted: 'false'
  };

  await upsertRow('services', 'service_id', next);
  res.json({ ...payload, id: next.service_id });
});

app.delete('/api/services/:id', requireAuth, async (req, res) => {
  const rows = await readTable('services');
  const idx = rows.findIndex((r) => r.user_id === req.user.userId && r.service_id === req.params.id);
  if (idx >= 0) {
    rows[idx].is_deleted = 'true';
    rows[idx].updated_at = nowIso();
    await upsertRow('services', 'service_id', rows[idx]);
  }
  res.json({ ok: true });
});

app.get('/api/drafts', requireAuth, async (req, res) => {
  const rows = await readTable('drafts');
  res.json(serializeDrafts(rows, req.user.userId));
});

app.put('/api/drafts', requireAuth, async (req, res) => {
  const drafts = Array.isArray(req.body.drafts) ? req.body.drafts : [];
  const rows = await readTable('drafts');
  const userRows = rows.filter((r) => r.user_id === req.user.userId);
  const now = nowIso();

  const normalizedDrafts = drafts.map((draft) => {
    const id = draft.id || uuidv4();
    return {
      ...draft,
      id
    };
  });
  const nextIds = new Set(normalizedDrafts.map((d) => d.id));

  for (const draft of normalizedDrafts) {
    await upsertRow('drafts', 'draft_id', {
      draft_id: draft.id,
      user_id: req.user.userId,
      invoiceNo: draft.invoiceNo || '',
      payload_json: JSON.stringify(draft),
      updated_at: draft.updatedAt || now
    });
  }

  const toDelete = userRows
    .filter((row) => row.draft_id && !nextIds.has(row.draft_id))
    .map((row) => row.__rowNumber);

  await deleteRows('drafts', toDelete);
  res.json({ ok: true, count: normalizedDrafts.length });
});

app.get('/api/invoices', requireAuth, async (req, res) => {
  const rows = await readTable('invoices');
  res.json(serializeInvoices(rows, req.user.userId));
});

app.get('/api/invoices/:id', requireAuth, async (req, res) => {
  const rows = await readTable('invoices');
  const row = rows.find((r) => r.user_id === req.user.userId && r.invoice_id === req.params.id && !asBoolean(r.is_deleted || 'false'));
  if (!row) return res.status(404).json({ error: 'Invoice not found' });

  let payload = null;
  try {
    payload = JSON.parse(row.payload_json || '{}');
  } catch {
    payload = null;
  }

  res.json({
    invoice: {
      id: row.invoice_id,
      invoiceNo: row.invoice_no,
      invoiceDate: row.invoice_date,
      clientName: row.client_name,
      clientEmail: row.client_email,
      currency: row.currency,
      grandTotal: Number(row.grand_total || 0),
      status: row.status || 'sent',
      payload,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  });
});

app.post('/api/invoices', requireAuth, async (req, res) => {
  const payload = req.body || {};
  const now = nowIso();
  const invoiceId = payload.id || uuidv4();
  const invoiceNo = String(payload.invoiceNo || '').trim();
  const invoiceDate = String(payload.invoiceDate || '').trim();
  const clientName = String(payload.clientName || '').trim();
  const clientEmail = String(payload.clientEmail || '').trim();
  const currency = String(payload.currency || 'CAD');
  const grandTotal = Number(payload.grandTotal || 0);
  const status = String(payload.status || 'sent');
  const invoicePayload = payload.payload || {};

  if (!invoiceNo || !invoiceDate || !clientName) {
    return res.status(400).json({ error: 'invoiceNo, invoiceDate and clientName are required' });
  }

  const rows = await readTable('invoices');
  const existing = rows.find((r) => r.user_id === req.user.userId && r.invoice_id === invoiceId);

  const row = {
    invoice_id: invoiceId,
    user_id: req.user.userId,
    invoice_no: invoiceNo,
    invoice_date: invoiceDate,
    client_name: clientName,
    client_email: clientEmail,
    currency,
    grand_total: String(grandTotal),
    status,
    payload_json: JSON.stringify(invoicePayload),
    created_at: existing?.created_at || now,
    updated_at: now,
    is_deleted: 'false'
  };

  await upsertRow('invoices', 'invoice_id', row);
  res.json({ ok: true, id: invoiceId });
});

app.delete('/api/invoices/:id', requireAuth, async (req, res) => {
  const rows = await readTable('invoices');
  const row = rows.find((r) => r.user_id === req.user.userId && r.invoice_id === req.params.id);
  if (!row) return res.json({ ok: true });

  row.is_deleted = 'true';
  row.updated_at = nowIso();
  await upsertRow('invoices', 'invoice_id', row);
  res.json({ ok: true });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, at: nowIso() });
});

app.use(express.static(path.join(__dirname, '..')));
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

(async () => {
  try {
    mustGetEnv('JWT_SECRET');
    mustGetEnv('GOOGLE_SHEET_ID');
    mustGetEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    mustGetEnv('GOOGLE_PRIVATE_KEY');
    await initSheets();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
})();
