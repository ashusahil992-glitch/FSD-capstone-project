import { createSlice } from '@reduxjs/toolkit';

const WISHLIST_KEY = 'campusbazaar_wishlist';

function loadWishlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string' || Number.isSafeInteger(id)) : [];
  } catch {
    return [];
  }
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: () => ({ ids: loadWishlist() }),
  reducers: {
    toggleWishlist(state, { payload: listingId }) {
      const listingKey = String(listingId);
      const existingIndex = state.ids.findIndex((id) => String(id) === listingKey);
      if (existingIndex >= 0) state.ids.splice(existingIndex, 1);
      else state.ids.push(listingId);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(state.ids));
    },
    clearWishlist(state) {
      state.ids = [];
      localStorage.removeItem(WISHLIST_KEY);
    },
  },
});

export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
