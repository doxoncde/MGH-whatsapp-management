const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN = new URLSearchParams(window.location.search).get('token')
  || localStorage.getItem('mgh_token')
  || 'mgh-dashboard-razi1811-token-change-me';

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchOverview() { return apiFetch('/dashboard/overview'); }
export async function fetchBot() { return apiFetch('/dashboard/bot'); }
export async function fetchCustomers(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/customers?${qs}`);
}
export async function fetchCustomer(id) { return apiFetch(`/customers/${id}`); }
export async function createCustomer(data) { return apiFetch('/customers', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateCustomer(id, data) { return apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function fetchTeam() { return apiFetch('/dashboard/team'); }
export async function fetchEmployee(id) { return apiFetch(`/dashboard/team/${id}`); }
export async function fetchSystemHealth() { return apiFetch('/system/health'); }
export async function fetchCampaigns() { return apiFetch('/campaigns'); }
export async function createCampaign(data) { return apiFetch('/campaigns', { method: 'POST', body: JSON.stringify(data) }); }
export async function sendCampaign(id) { return apiFetch(`/campaigns/${id}/send`, { method: 'POST' }); }
export async function previewSegment(data) { return apiFetch('/campaigns/segment-preview', { method: 'POST', body: JSON.stringify(data) }); }
