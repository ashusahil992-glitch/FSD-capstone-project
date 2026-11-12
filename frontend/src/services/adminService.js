import api from './api.js';

export async function fetchAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data.data;
}

export async function fetchAdminUsers() {
  const { data } = await api.get('/admin/users');
  return data.data;
}

export async function fetchAdminListings() {
  const { data } = await api.get('/admin/listings');
  return data.data;
}

export async function fetchAdminReports() {
  const { data } = await api.get('/admin/reports');
  return data.data;
}

export async function verifyStudent(userId) {
  const { data } = await api.patch(`/admin/users/${userId}/verify-student`);
  return data.data;
}

export async function suspendUser(userId) {
  const { data } = await api.patch(`/admin/users/${userId}/suspend`);
  return data.data;
}

export async function reinstateUser(userId) {
  const { data } = await api.patch(`/admin/users/${userId}/reinstate`);
  return data.data;
}

export async function moderateListing(listingId, status) {
  const { data } = await api.patch(`/admin/listings/${listingId}/moderation`, { status });
  return data.data;
}

export async function reviewReport(reportId, status) {
  const { data } = await api.patch(`/admin/reports/${reportId}`, { status });
  return data.data;
}
