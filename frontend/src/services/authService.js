import api from './api.js';

export async function registerAccount(account) {
  const { data } = await api.post('/auth/register', account);
  return data.data;
}

export async function loginAccount(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data.data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
