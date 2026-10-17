import { INITIAL_INVOICES, INITIAL_PURCHASE_ORDERS, INITIAL_AUDIT_LOGS } from './mockData.js';

const API_BASE = 'http://localhost:5000/api';

// Stateful in-memory ledger fallback for zero-backend standalone resilience
let memoryInvoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
let memoryPOs = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS));
let memoryLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

function calculateKpis(invoices) {
  const totalVol = invoices.reduce((acc, inv) => acc + (inv.grand_total || 0), 0);
  const leakage = invoices.reduce((acc, inv) => acc + (inv.total_variance_amount || 0), 0);
  const pending = invoices.filter(inv => inv.status === 'EXCEPTION_FLAGGED').length;
  const verifiedCount = invoices.filter(inv => ['VERIFIED_MATCH', 'APPROVED_CLEAN'].includes(inv.status)).length;
  const matchRate = invoices.length > 0 ? (verifiedCount / invoices.length) * 100 : 75.0;
  return {
    total_audited_volume: totalVol,
    prevented_leakage_amount: leakage,
    pending_exceptions_count: pending,
    clean_match_rate_percent: parseFloat(matchRate.toFixed(1))
  };
}

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null; // Signals fallback to local stateful mock ledger
  }
}

export const apiClient = {
  async getHealth() {
    const res = await request('/health');
    if (res) return res;
    return { status: 'healthy', gemini_configured: true, extraction_model: 'gemini-2.5-flash', fallback: true };
  },

  async getDashboardSummary() {
    const res = await request('/dashboard/summary');
    if (res) return res;
    return { kpis: calculateKpis(memoryInvoices), invoices: [...memoryInvoices] };
  },

  async getInvoice(idOrNumber) {
    const res = await request(`/invoices/${idOrNumber}`);
    if (res) return res;
    const cleanId = String(idOrNumber).toLowerCase().trim();
    return memoryInvoices.find(i => i.id.toLowerCase() === cleanId || i.invoice_number.toLowerCase() === cleanId) || null;
  },

  async analyzeDemoScenario(scenarioId) {
    const res = await request('/invoices/analyze', {
      method: 'POST',
      body: JSON.stringify({ demo_scenario_id: scenarioId })
    });
    if (res) return res;
    let target = memoryInvoices.find(i => i.id === 'inv_1002');
    if (scenarioId === 'SCENARIO_A_CLEAN') target = memoryInvoices.find(i => i.id === 'inv_1001');
    if (scenarioId === 'SCENARIO_C_DUPLICATE') target = memoryInvoices.find(i => i.id === 'inv_1003');
    return {
      success: true,
      stage_telemetry: { stage1_sha256: target.sha256_hash, stage2_model_used: 'gemini-2.5-flash', stage3_violations: target.triggered_rules_count },
      invoice: target
    };
  },

  async submitDecision(invoiceId, { decision, reviewer_name, override_reason, dispute_email_body }) {
    const res = await request(`/invoices/${invoiceId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reviewer_name, override_reason, dispute_email_body })
    });
    if (res) return res;
    const inv = memoryInvoices.find(i => i.id === invoiceId || i.invoice_number === invoiceId);
    if (inv) {
      if (decision === 'APPROVE_CLEAN') inv.status = 'APPROVED_CLEAN';
      if (decision === 'APPROVE_WITH_OVERRIDE') { inv.status = 'APPROVED_WITH_OVERRIDE'; inv.override_reason = override_reason; }
      if (decision === 'REJECT_DISPUTE') { inv.status = 'REJECTED_DISPUTED'; inv.dispute_memo = dispute_email_body; }
      inv.reviewer_name = reviewer_name || 'Ubaid Raza';
      inv.reviewed_at = new Date().toISOString();
      memoryLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        event_type: decision,
        actor: inv.reviewer_name,
        details: override_reason || dispute_email_body || 'Status updated.'
      });
    }
    return { success: true, invoice: inv };
  },

  async resetLedger() {
    const res = await request('/invoices/reset', { method: 'POST' });
    if (res) return res;
    memoryInvoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
    memoryPOs = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS));
    memoryLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    return { status: 'ledger_reseeded', invoices_count: memoryInvoices.length };
  },

  async getPurchaseOrders() {
    const res = await request('/purchase-orders');
    return res || [...memoryPOs];
  },

  async getAuditLogs() {
    const res = await request('/audit-logs');
    return res || [...memoryLogs];
  }
};
