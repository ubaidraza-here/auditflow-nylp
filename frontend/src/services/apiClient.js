import {
  MOCK_KPIS,
  MOCK_INVOICES,
  MOCK_PURCHASE_ORDERS,
  MOCK_AUDIT_LOGS,
  getInitialMockInvoices,
} from './mockData.js';

function normalizeApiBaseUrl(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return 'http://localhost:5000/api';
  }
  const clean = raw.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

function getSessionInvoices() {
  try {
    const s = sessionStorage.getItem('auditflow_live_invoices');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...MOCK_INVOICES];
}

function setSessionInvoices(invoices) {
  try {
    sessionStorage.setItem('auditflow_live_invoices', JSON.stringify(invoices));
  } catch {}
}

function getSessionLogs() {
  try {
    const s = sessionStorage.getItem('auditflow_live_audit_logs');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...MOCK_AUDIT_LOGS];
}

function setSessionLogs(logs) {
  try {
    sessionStorage.setItem('auditflow_live_audit_logs', JSON.stringify(logs));
  } catch {}
}

let localInvoices = getSessionInvoices();
let localKpis = { ...MOCK_KPIS };
let localLogs = getSessionLogs();

async function request(endpoint, options = {}, fallbackData) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return typeof fallbackData === 'function' ? fallbackData() : fallbackData;
  }
}

export const apiClient = {
  API_BASE_URL,

  async computeFileSha256(file) {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    }
  },

  async uploadInvoiceFile(file) {
    const sha256 = await this.computeFileSha256(file);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_sha256', sha256);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(`${API_BASE_URL}/invoices/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const invoice = data.invoice || data;
      if (invoice?.invoice_id || invoice?.id) {
        invoice.file_hash_sha256 = invoice.file_hash_sha256 || sha256;
        const targetId = invoice.invoice_id || invoice.id;
        const idx = localInvoices.findIndex((i) => (i.invoice_id || i.id) === targetId);
        if (idx !== -1) localInvoices[idx] = invoice;
        else localInvoices = [invoice, ...localInvoices];
        setSessionInvoices(localInvoices);
      }
      return { success: true, invoice, sha256, stage_telemetry: data.stage_telemetry };
    } catch (err) {
      console.warn('Live API upload failed, falling back to simulation and sessionStorage:', err);
      return this._simulateFileUpload(file, sha256);
    }
  },

  _simulateFileUpload(file, sha256) {
    const fn = (file.name || '').toLowerCase();
    const blueprint = getInitialMockInvoices();
    const isExactDup = localInvoices.some((inv) => inv.file_hash_sha256 === sha256);

    let targetNum = 'INV-9042';
    if (!isExactDup && (fn.includes('clean') || fn.includes('8801') || fn.includes('cloudhost'))) {
      targetNum = 'INV-8801';
    } else if (isExactDup || fn.includes('dup') || fn.includes('7710') || fn.includes('prime')) {
      targetNum = 'INV-7710-REV';
    }

    const base = blueprint.find((i) => i.invoice_number === targetNum) || blueprint[0];
    const newInv = JSON.parse(JSON.stringify(base));
    newInv.invoice_id = `inv_${Date.now()}`;
    newInv.file_name = file.name;
    newInv.file_hash_sha256 = sha256;
    try { newInv.file_url = URL.createObjectURL(file); } catch {}
    newInv.extraction_mode = 'FALLBACK_SIMULATION';
    delete newInv.decision_metadata;

    if (isExactDup) {
      newInv.status = 'EXCEPTION_FLAGGED';
      const exactDupFlag = {
        flag_id: `flag_exact_${Date.now()}`,
        rule_code: 'EXACT_FILE_DUPLICATE',
        severity: 'CRITICAL',
        title: 'Exact Cryptographic File Duplicate Detected',
        explanation: `File SHA-256 hash (${sha256.slice(0, 16)}...) matches an existing invoice. Identical file previously ingested.`,
        financial_impact: newInv.grand_total,
      };
      newInv.discrepancies = [exactDupFlag, ...(newInv.discrepancies || [])];
      newInv.discrepancy_count = newInv.discrepancies.length;
      newInv.flag_reason = 'Critical: Exact Cryptographic Duplicate File Upload';
    }

    localInvoices = [newInv, ...localInvoices];
    setSessionInvoices(localInvoices);
    return { success: true, invoice: newInv, sha256 };
  },

  async getDashboardSummary() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const liveData = await res.json();
        if (liveData && (liveData.invoices || liveData.kpis)) {
          if (Array.isArray(liveData.invoices) && liveData.invoices.length > 0) {
            localInvoices = liveData.invoices;
            setSessionInvoices(localInvoices);
          }
          if (liveData.kpis) {
            localKpis = liveData.kpis;
          }
          return liveData;
        }
      }
    } catch (err) {
      console.warn('Live getDashboardSummary failed, falling back to sessionStorage:', err);
    }

    const cached = getSessionInvoices();
    return {
      kpis: { ...localKpis },
      invoices: cached.length > 0 ? cached : [...localInvoices],
    };
  },

  async getPurchaseOrders() {
    return request('/purchase-orders', {}, () => [...MOCK_PURCHASE_ORDERS]);
  },

  async getAuditLogs() {
    return request('/audit-logs', {}, () => getSessionLogs());
  },

  async getInvoiceById(id) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const liveInvoice = await res.json();
        if (liveInvoice) {
          const inv = liveInvoice.invoice || liveInvoice;
          const targetId = inv.invoice_id || inv.id;
          if (targetId) {
            const idx = localInvoices.findIndex((i) => (i.invoice_id || i.id) === targetId);
            if (idx !== -1) localInvoices[idx] = inv;
            else localInvoices = [inv, ...localInvoices];
            setSessionInvoices(localInvoices);
          }
          return inv;
        }
      }
    } catch (err) {
      console.warn(`Live getInvoiceById(${id}) failed, falling back to sessionStorage:`, err);
    }

    const cached = getSessionInvoices();
    const match = cached.find((i) => i.invoice_id === id || i.invoice_number === id || i.id === id);
    return match || localInvoices.find((i) => i.invoice_id === id || i.invoice_number === id || i.id === id) || cached[0] || localInvoices[0];
  },

  async getInvoice(id) {
    return this.getInvoiceById(id);
  },

  async submitDecision(invoiceId, { decision, reviewer_name, justification_notes, override_reason, dispute_email_body }) {
    const notes = justification_notes || override_reason || dispute_email_body;
    return request(
      `/invoices/${invoiceId}/decision`,
      { method: 'POST', body: JSON.stringify({ decision, reviewer_name, justification_notes: notes, override_reason, dispute_email_body }) },
      () => {
        const existing = localInvoices.find((i) => (i.invoice_id || i.id) === invoiceId || i.invoice_number === invoiceId);
        if (!existing) return { success: false };
        let nextStatus = 'APPROVED_CLEAN';
        if (decision === 'REJECT_DISPUTE') nextStatus = 'REJECTED_DISPUTED';
        else if (decision === 'APPROVE_WITH_OVERRIDE') nextStatus = 'APPROVED_WITH_OVERRIDE';
        const timestamp = new Date().toISOString();
        const reviewer = reviewer_name || 'Ubaid Raza (Senior AP Auditor)';
        const updated = {
          ...existing,
          status: nextStatus,
          reviewer_name: reviewer,
          reviewed_at: timestamp,
          override_reason: override_reason || notes,
          dispute_memo: dispute_email_body,
          decision_metadata: { timestamp, reviewer_name: reviewer, justification_notes: notes, decision_type: decision },
        };
        localInvoices = localInvoices.map((inv) => ((inv.invoice_id || inv.id) === (existing.invoice_id || existing.id) ? updated : inv));
        setSessionInvoices(localInvoices);
        return { success: true, invoice_id: updated.invoice_id || updated.id, new_status: nextStatus, updated_invoice: updated };
      }
    );
  },

  async resetInvoiceState(invoiceId) {
    const blueprint = getInitialMockInvoices();
    const original = blueprint.find((i) => (i.invoice_id || i.id) === invoiceId || i.invoice_number === invoiceId) || blueprint[0];
    const fresh = JSON.parse(JSON.stringify(original));
    delete fresh.decision_metadata;
    localInvoices = localInvoices.map((inv) => ((inv.invoice_id || inv.id) === (fresh.invoice_id || fresh.id) ? fresh : inv));
    setSessionInvoices(localInvoices);
    return fresh;
  },

  async resetInvoice(invoiceId) {
    return this.resetInvoiceState(invoiceId);
  },

  async triggerDemoScenario(scenarioId) {
    return request(
      '/invoices/analyze',
      { method: 'POST', body: JSON.stringify({ demo_scenario_id: scenarioId }) },
      () => {
        const blueprint = getInitialMockInvoices();
        let targetNum = 'INV-8801';
        if (scenarioId === 'SCENARIO_B_OVERCHARGE') targetNum = 'INV-9042';
        else if (scenarioId === 'SCENARIO_C_DUPLICATE') targetNum = 'INV-7710-REV';
        const fresh = JSON.parse(JSON.stringify(blueprint.find((i) => i.invoice_number === targetNum) || blueprint[0]));
        delete fresh.decision_metadata;
        const targetId = fresh.invoice_id || fresh.id;
        const idx = localInvoices.findIndex((i) => (i.invoice_id || i.id) === targetId);
        if (idx !== -1) localInvoices[idx] = fresh;
        else localInvoices = [fresh, ...localInvoices];
        setSessionInvoices(localInvoices);
        return { success: true, invoice: fresh };
      }
    );
  },

  async analyzeDemoScenario(scenarioId) {
    return this.triggerDemoScenario(scenarioId);
  },

  async resetAll() {
    try { sessionStorage.removeItem('auditflow_live_invoices'); } catch {}
    try { sessionStorage.removeItem('auditflow_live_audit_logs'); } catch {}
    return request('/invoices/reset', { method: 'POST' }, () => {
      localInvoices = getInitialMockInvoices();
      localKpis = { ...MOCK_KPIS };
      localLogs = [...MOCK_AUDIT_LOGS];
      setSessionInvoices(localInvoices);
      setSessionLogs(localLogs);
      return { success: true, message: 'All demo invoices and audit logs reset.' };
    });
  },

  async resetLedger() {
    return this.resetAll();
  },

  async resetAllDemoData() {
    return this.resetAll();
  },
};
