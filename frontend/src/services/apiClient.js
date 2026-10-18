import {
  MOCK_KPIS,
  MOCK_INVOICES,
  MOCK_PURCHASE_ORDERS,
  MOCK_AUDIT_LOGS,
  getInitialMockInvoices,
} from './mockData.js';

const API_BASE_URL = 'http://localhost:5000/api';

let localInvoices = [...MOCK_INVOICES];
let localKpis = { ...MOCK_KPIS };
let localLogs = [...MOCK_AUDIT_LOGS];

async function request(endpoint, options = {}, fallbackData) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
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

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      const res = await fetch(`${API_BASE_URL}/invoices/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const invoice = data.invoice || data;
      if (invoice?.invoice_id) {
        const idx = localInvoices.findIndex((i) => i.invoice_id === invoice.invoice_id);
        if (idx !== -1) localInvoices[idx] = invoice;
        else localInvoices = [invoice, ...localInvoices];
      }
      return { success: true, invoice, sha256 };
    } catch (err) {
      console.warn('Live API upload failed, falling back to simulation:', err);
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
    newInv.file_url = URL.createObjectURL(file);
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
    return { success: true, invoice: newInv, sha256 };
  },

  async getDashboardSummary() {
    return request('/dashboard/summary', {}, () => ({
      kpis: { ...localKpis },
      invoices: [...localInvoices],
    }));
  },

  async getPurchaseOrders() {
    return request('/purchase-orders', {}, () => [...MOCK_PURCHASE_ORDERS]);
  },

  async getAuditLogs() {
    return request('/audit-logs', {}, () => [...localLogs]);
  },

  async getInvoiceById(id) {
    return request(`/invoices/${id}`, {}, () => {
      const match = localInvoices.find((i) => i.invoice_id === id || i.invoice_number === id);
      return match || localInvoices.find((i) => i.invoice_id === 'inv_1002') || localInvoices[0];
    });
  },

  async submitDecision(invoiceId, { decision, reviewer_name, justification_notes }) {
    return request(
      `/invoices/${invoiceId}/decision`,
      { method: 'POST', body: JSON.stringify({ decision, reviewer_name, justification_notes }) },
      () => {
        const existing = localInvoices.find((i) => i.invoice_id === invoiceId || i.invoice_number === invoiceId);
        if (!existing) return { success: false };
        let nextStatus = 'APPROVED_CLEAN';
        if (decision === 'REJECT_DISPUTE') nextStatus = 'REJECTED_DISPUTED';
        else if (decision === 'APPROVE_WITH_OVERRIDE') nextStatus = 'APPROVED_WITH_OVERRIDE';
        const timestamp = new Date().toISOString();
        const reviewer = reviewer_name || 'Ubaid Raza (Senior AP Auditor)';
        const notes = justification_notes || 'Approved/disputed by compliance auditor.';
        const updated = {
          ...existing,
          status: nextStatus,
          decision_metadata: { timestamp, reviewer_name: reviewer, justification_notes: notes, decision_type: decision },
        };
        localInvoices = localInvoices.map((inv) => (inv.invoice_id === existing.invoice_id ? updated : inv));
        return { success: true, invoice_id: updated.invoice_id, new_status: nextStatus, updated_invoice: updated };
      }
    );
  },

  async resetInvoiceState(invoiceId) {
    const blueprint = getInitialMockInvoices();
    const original = blueprint.find((i) => i.invoice_id === invoiceId || i.invoice_number === invoiceId) || blueprint[0];
    const fresh = JSON.parse(JSON.stringify(original));
    delete fresh.decision_metadata;
    localInvoices = localInvoices.map((inv) => (inv.invoice_id === fresh.invoice_id ? fresh : inv));
    return fresh;
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
        const idx = localInvoices.findIndex((i) => i.invoice_id === fresh.invoice_id);
        if (idx !== -1) localInvoices[idx] = fresh;
        else localInvoices = [fresh, ...localInvoices];
        return { success: true, invoice: fresh };
      }
    );
  },

  async resetAll() {
    return request('/invoices/reset', { method: 'POST' }, () => {
      localInvoices = getInitialMockInvoices();
      localKpis = { ...MOCK_KPIS };
      localLogs = [...MOCK_AUDIT_LOGS];
      return { success: true, message: 'All demo invoices and audit logs reset.' };
    });
  },
};
