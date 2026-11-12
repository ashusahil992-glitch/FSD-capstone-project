import api from './api.js';

export async function fetchListings() {
  const { data } = await api.get('/listings');
  return data.data;
}

export async function fetchMyListings() {
  const { data } = await api.get('/listings/mine');
  return data.data;
}

export async function searchListings(filters = {}) {
  const { data } = await api.get('/listings/search', { params: filters });
  return data.data;
}

export async function fetchListing(id) {
  const { data } = await api.get(`/listings/${id}`);
  return data.data;
}

export async function createListing(listing) {
  const { data } = await api.post('/listings', listing);
  return data.data;
}

export async function updateListing(id, listing) {
  const { data } = await api.put(`/listings/${id}`, listing);
  return data.data;
}

export async function updateListingStatus(id, status) {
  const { data } = await api.patch(`/listings/${id}/status`, null, { params: { status } });
  return data.data;
}

export async function deleteListing(id) {
  await api.delete(`/listings/${id}`);
}
