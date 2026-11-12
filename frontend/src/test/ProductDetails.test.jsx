import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductDetails from '../pages/ProductDetails.jsx';
import { deleteListing, fetchListing, updateListingStatus } from '../services/listingService.js';
import { sendMessage, startConversation, submitListingReport } from '../services/messagingService.js';
import authReducer, { setCredentials } from '../redux/authSlice.js';
import wishlistReducer from '../redux/wishlistSlice.js';

vi.mock('../services/listingService.js', () => ({
  fetchListing: vi.fn(),
  deleteListing: vi.fn(),
  updateListingStatus: vi.fn(),
}));

vi.mock('../services/messagingService.js', () => ({
  startConversation: vi.fn(),
  sendMessage: vi.fn(),
  submitListingReport: vi.fn(),
}));

describe('Product details', () => {
  beforeEach(() => {
    vi.mocked(fetchListing).mockResolvedValue({
      id: 42,
      title: 'Acoustic guitar',
      description: 'Beginner-friendly guitar available to rent for the semester.',
      price: 0,
      condition: 'GOOD',
      listingType: 'RENT',
      status: 'AVAILABLE',
      imageUrl: null,
      category: { name: 'Music', slug: 'music', icon: '🎸' },
      seller: { id: 11, name: 'Campus student', verified: true, university: 'Chitkara University', hostel: 'Archimedes Hostel' },
      demo: true,
      createdAt: '2026-10-01T10:00:00Z',
    });
  });

  it('loads the listing by route id and renders its full details', async () => {
    render(
      <MemoryRouter initialEntries={['/listings/42']}>
        <Provider store={configureStore({ reducer: { auth: authReducer, wishlist: wishlistReducer } })}>
          <Routes>
            <Route path="/listings/:id" element={<ProductDetails />} />
            <Route path="/messages/:conversationId" element={<h1>Conversation view</h1>} />
            <Route path="/login" element={<h1>Sign in page</h1>} />
          </Routes>
        </Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Acoustic guitar' })).toBeInTheDocument();
    expect(fetchListing).toHaveBeenCalledWith('42');
    expect(screen.getByText('Beginner-friendly guitar available to rent for the semester.')).toBeInTheDocument();
    expect(screen.getByText('For rent')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Campus student')).toBeInTheDocument();
    expect(screen.getByText(/Verified student/)).toBeInTheDocument();
  });

  it('submits listing reports for signed-in students', async () => {
    vi.mocked(submitListingReport).mockResolvedValue({});
    const store = configureStore({ reducer: { auth: authReducer, wishlist: wishlistReducer } });
    store.dispatch(setCredentials({ token: 'student-token', user: { id: 22 } }));
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/listings/42']}>
          <Routes>
            <Route path="/listings/:id" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    await screen.findByRole('heading', { name: 'Acoustic guitar' });
    fireEvent.click(screen.getByRole('button', { name: 'Report this listing' }));
    fireEvent.change(screen.getByLabelText(/Why are you reporting/), { target: { value: 'This listing looks suspicious.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Your report has been sent');
    expect(submitListingReport).toHaveBeenCalledWith(42, 'This listing looks suspicious.');
  });

  it('shows listing controls to the owner and removes the listing through the API', async () => {
    vi.mocked(deleteListing).mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const store = configureStore({ reducer: { auth: authReducer, wishlist: wishlistReducer } });
    store.dispatch(setCredentials({ token: 'student-token', user: { id: 11 } }));
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/listings/42']}>
          <Routes>
            <Route path="/listings/:id" element={<ProductDetails />} />
            <Route path="/" element={<h1>Marketplace home</h1>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    await screen.findByRole('heading', { name: 'Acoustic guitar' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete listing' }));
    expect(await screen.findByRole('heading', { name: 'Marketplace home' })).toBeInTheDocument();
    expect(deleteListing).toHaveBeenCalledWith('42');
    confirm.mockRestore();
  });
});
