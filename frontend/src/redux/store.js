import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import wishlistReducer from './wishlistSlice.js';

export function createAppStore() {
  return configureStore({ reducer: { auth: authReducer, wishlist: wishlistReducer } });
}

const store = createAppStore();
export default store;
