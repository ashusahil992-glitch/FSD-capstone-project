import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer, { setCredentials } from '../redux/authSlice.js';
import SellItem from '../pages/SellItem.jsx';
import { fetchCategories } from '../services/categoryService.js';
import { createListing, fetchListing, updateListing } from '../services/listingService.js';

vi.mock('../services/categoryService.js', () => ({
  fetchCategories: vi.fn(),
}));

vi.mock('../services/listingService.js', () => ({
  createListing: vi.fn(),
  fetchListing: vi.fn(),
  updateListing: vi.fn(),
}));

function renderSellItem(authenticated = true, initialPath = '/sell', user = { id: 10, fullName: 'Test Student' }) {
  if (authenticated) {
    localStorage.setItem('campusbazaar_token', 'test-token');
    localStorage.setItem('campusbazaar_user', JSON.stringify(user));
  }
  const store = configureStore({ reducer: { auth: authReducer } });
  if (authenticated) {
    store.dispatch(setCredentials({ token: 'test-token', user }));
  }
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/sell" element={<SellItem />} />
          <Route path="/listings/:id/edit" element={<SellItem />} />
          <Route path="/listings/:id" element={<h1>Listing details</h1>} />
          <Route path="/login" element={<h1>Sign in page</h1>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('Sell item form', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(fetchListing).mockReset();
    vi.mocked(updateListing).mockReset();
    vi.mocked(fetchCategories).mockResolvedValue([
      { id: 1, name: 'Books', slug: 'academic-books', parentName: 'Academic' },
    ]);
  });

  it('requires an account before showing the publishing form', () => {
    renderSellItem(false);
    expect(screen.getByRole('heading', { name: 'Sign in to sell on campus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('saves the listing using the API and navigates to its details', async () => {
    vi.mocked(createListing).mockResolvedValue({ id: 81, title: 'Physics textbook' });
    renderSellItem();

    fireEvent.change(await screen.findByLabelText(/Item title/), { target: { value: 'Physics textbook' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'academic-books' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Condition/), { target: { value: 'GOOD' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Good condition, clean pages.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish listing' }));

    await screen.findByRole('heading', { name: 'Listing details' });
    expect(createListing).toHaveBeenCalledWith({
      title: 'Physics textbook',
      description: 'Good condition, clean pages.',
      categorySlug: 'academic-books',
      listingType: 'SALE',
      condition: 'GOOD',
      price: 500,
    });
  });

  it('sends giveaways at zero price and displays backend failures', async () => {
    vi.mocked(createListing).mockRejectedValueOnce(Object.assign(new Error('Category not found'), {
      userMessage: 'The selected category is not available.',
    }));
    renderSellItem();

    fireEvent.change(await screen.findByLabelText(/Item title/), { target: { value: 'Free notebook' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'academic-books' } });
    fireEvent.change(screen.getByLabelText(/What would you like to do/), { target: { value: 'GIVEAWAY' } });
    fireEvent.change(screen.getByLabelText(/Condition/), { target: { value: 'GOOD' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Free for pickup.' } });
    expect(screen.queryByLabelText(/Price/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publish listing' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The selected category is not available.');
    await waitFor(() => expect(createListing).toHaveBeenCalledWith(expect.objectContaining({
      listingType: 'GIVEAWAY',
      price: 0,
    })));
  });

  it('loads and updates only the authenticated owner’s listing', async () => {
    vi.mocked(fetchListing).mockResolvedValue({
      id: 81,
      title: 'Physics textbook',
      description: 'Good condition, clean pages.',
      price: 500,
      condition: 'GOOD',
      listingType: 'SALE',
      category: { slug: 'academic-books' },
      seller: { id: 10 },
    });
    vi.mocked(updateListing).mockResolvedValue({ id: 81 });
    renderSellItem(true, '/listings/81/edit');

    const title = await screen.findByLabelText(/Item title/);
    expect(title).toHaveValue('Physics textbook');
    fireEvent.change(title, { target: { value: 'Updated physics textbook' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByRole('heading', { name: 'Listing details' });
    expect(updateListing).toHaveBeenCalledWith('81', expect.objectContaining({
      title: 'Updated physics textbook',
      price: 500,
      categorySlug: 'academic-books',
    }));
  });
});
