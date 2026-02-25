const { google } = require('googleapis');
const tableCache = new Map();
let apiClientPromise = null;
let schemaInitialized = false;

function getCacheTtlMs() {
  return Number(process.env.SHEETS_CACHE_TTL_MS || 10000);
}

const SHEETS = {
  users: {
    tab: 'users',
    headers: ['user_id', 'email', 'password_hash', 'full_name', 'is_active', 'created_at', 'updated_at', 'last_login_at', 'country']
  },
  settings: {
    tab: 'settings',
    headers: [
      'settings_id', 'user_id', 'companyName', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGstin',
      'signatoryName', 'bankName', 'bankAccount', 'bankHolder', 'payableTo', 'bankSwift', 'bankUpi',
      'defaultNotes', 'defaultCurrency', 'defaultTaxPct', 'defaultPaymentTerms', 'invoicePrefix', 'updated_at', 'bankAddress'
    ]
  },
  clients: {
    tab: 'clients',
    headers: ['client_id', 'user_id', 'name', 'email', 'phone', 'address', 'terms', 'created_at', 'updated_at', 'is_deleted']
  },
  services: {
    tab: 'services',
    headers: ['service_id', 'user_id', 'name', 'hsn', 'desc', 'created_at', 'updated_at', 'is_deleted']
  },
  drafts: {
    tab: 'drafts',
    headers: ['draft_id', 'user_id', 'invoiceNo', 'payload_json', 'updated_at']
  },
  invoices: {
    tab: 'invoices',
    headers: [
      'invoice_id', 'user_id', 'invoice_no', 'invoice_date', 'client_name', 'client_email',
      'currency', 'grand_total', 'status', 'payload_json', 'created_at', 'updated_at', 'is_deleted'
    ]
  }
};

function getGoogleClient() {
  const privateKey = String(process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}

async function getSheetsApi() {
  if (!apiClientPromise) {
    apiClientPromise = (async () => {
      const auth = getGoogleClient();
      const authClient = await auth.getClient();
      return google.sheets({ version: 'v4', auth: authClient });
    })();
  }
  return apiClientPromise;
}

async function ensureTab(api, tabDef) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const meta = await api.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === tabDef.tab);

  if (!exists) {
    await api.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabDef.tab } } }] }
    });
  }

  const current = await api.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabDef.tab}!1:1`
  });
  const headerRow = current.data.values?.[0] || [];
  const mismatch = tabDef.headers.some((h, i) => headerRow[i] !== h);

  if (!headerRow.length || mismatch) {
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabDef.tab}!1:1`,
      valueInputOption: 'RAW',
      requestBody: { values: [tabDef.headers] }
    });
  }
}

async function initSheets() {
  const api = await getSheetsApi();
  for (const tabDef of Object.values(SHEETS)) {
    await ensureTab(api, tabDef);
  }
  schemaInitialized = true;
}

function cloneRows(rows) {
  return rows.map((row) => ({ ...row }));
}

async function ensureInitialized() {
  if (schemaInitialized) return;
  await initSheets();
}

async function readTable(tableName) {
  await ensureInitialized();
  const cached = tableCache.get(tableName);
  if (cached && cached.expiresAt > Date.now()) {
    return cloneRows(cached.rows);
  }

  const tabDef = SHEETS[tableName];
  const api = await getSheetsApi();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const res = await api.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabDef.tab}!A2:ZZ`
  });

  const rows = res.data.values || [];
  const mapped = rows.map((row, idx) => {
    const obj = {};
    tabDef.headers.forEach((header, idx) => {
      obj[header] = row[idx] ?? '';
    });
    obj.__rowNumber = idx + 2;
    return obj;
  });
  tableCache.set(tableName, { rows: mapped, expiresAt: Date.now() + getCacheTtlMs() });
  return cloneRows(mapped);
}

function toRows(tableName, objects) {
  const headers = SHEETS[tableName].headers;
  return objects.map((obj) => headers.map((h) => obj[h] ?? ''));
}

function stripInternalFields(row) {
  const clean = { ...row };
  delete clean.__rowNumber;
  return clean;
}

function toSingleRow(tableName, object) {
  const headers = SHEETS[tableName].headers;
  const clean = stripInternalFields(object);
  return headers.map((h) => clean[h] ?? '');
}

async function upsertRow(tableName, keyField, rowObject) {
  await ensureInitialized();
  const tabDef = SHEETS[tableName];
  const api = await getSheetsApi();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const rows = await readTable(tableName);
  const keyValue = String(rowObject[keyField] ?? '');
  const idx = rows.findIndex((r) => String(r[keyField] ?? '') === keyValue);
  const cleanRow = stripInternalFields(rowObject);

  if (idx >= 0) {
    const rowNumber = rows[idx].__rowNumber || idx + 2;
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabDef.tab}!A${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [toSingleRow(tableName, cleanRow)] }
    });
    rows[idx] = { ...cleanRow, __rowNumber: rowNumber };
  } else {
    await api.spreadsheets.values.append({
      spreadsheetId,
      range: `${tabDef.tab}!A:ZZ`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [toSingleRow(tableName, cleanRow)] }
    });
    rows.push({ ...cleanRow, __rowNumber: rows.length + 2 });
  }

  tableCache.set(tableName, { rows: cloneRows(rows), expiresAt: Date.now() + getCacheTtlMs() });
  return cleanRow;
}

async function deleteRows(tableName, rowNumbers) {
  await ensureInitialized();
  const uniqueDesc = [...new Set(rowNumbers.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 2))]
    .sort((a, b) => b - a);
  if (!uniqueDesc.length) return;

  const tabDef = SHEETS[tableName];
  const api = await getSheetsApi();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const meta = await api.spreadsheets.get({ spreadsheetId });
  const sheetId = meta.data.sheets?.find((s) => s.properties?.title === tabDef.tab)?.properties?.sheetId;
  if (sheetId === undefined) return;

  const requests = uniqueDesc.map((rowNumber) => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: rowNumber - 1,
        endIndex: rowNumber
      }
    }
  }));

  await api.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests }
  });

  tableCache.delete(tableName);
}

async function overwriteTable(tableName, rows) {
  await ensureInitialized();
  const tabDef = SHEETS[tableName];
  const api = await getSheetsApi();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  await api.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabDef.tab}!A2:ZZ`
  });

  const normalizedRows = rows.map((row, idx) => ({ ...stripInternalFields(row), __rowNumber: idx + 2 }));
  const values = toRows(tableName, normalizedRows);
  if (!values.length) {
    tableCache.set(tableName, { rows: [], expiresAt: Date.now() + getCacheTtlMs() });
    return;
  }

  await api.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabDef.tab}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values }
  });

  tableCache.set(tableName, { rows: cloneRows(normalizedRows), expiresAt: Date.now() + getCacheTtlMs() });
}

module.exports = {
  SHEETS,
  initSheets,
  readTable,
  upsertRow,
  deleteRows,
  overwriteTable
};
