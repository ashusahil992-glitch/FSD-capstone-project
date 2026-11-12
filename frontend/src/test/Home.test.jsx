import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../pages/Home.jsx';
import { fetchListings, searchListings } from '../services/listingService.js';
import { createAppStore } from '../redux/store.js';

vi.mock('../services/listingService.js', () => ({
  fetchListings: vi.fn(),
  searchListings: vi.fn(),
}));

const listings = [
  {
    id: 1,
    title: 'Engineering Mathematics textbook',
    description: 'Clean pages, lightly used.',
    price: 450,
    condition: 'GOOD',
    listingType: 'SALE',
    imageUrl: 'https://example.test/book.jpg',
    category: { name: 'Academic', slug: 'academic', icon: '📚' },
    seller: { name: 'Demo seller', verified: true },
    demo: true,
    popular: true,
    studentDeal: true,
    hostelClearance: false,
  },
  {
    id: 2,
    title: 'Free badminton racket',
    description: 'Take it to your next game.',
    price: 0,
    condition: 'FAIR',
    listingType: 'GIVEAWAY',
    imageUrl: null,
    category: { name: 'Sports & Fitness', slug: 'sports-and-fitness', icon: '🏸' },
    seller: { name: 'Campus student', verified: true },
    demo: true,
    popular: false,
    studentDeal: false,
    hostelClearance: false,
  },
];

function renderHome() {
  const store = createAppStore();
  return render(<Provider store={store}><MemoryRouter><Home /></MemoryRouter></Provider>);
}

describe('Home marketplace', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(fetchListings).mockResolvedValue(listings);
    vi.mocked(searchListings).mockImplementation(async ({ q, listingType, page }) => {
      const items = listingType === 'GIVEAWAY' ? [listings[1]] : q ? [listings[0]] : listings;
      return {
        items,
        page,
        size: 8,
        totalElements: items.length,
        totalPages: 1,
        first: page === 0,
        last: true,
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders product records from the listings service without public health details', async () => {
    renderHome();
    expect(await screen.findByRole('heading', { name: 'Recently Listed' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Engineering Mathematics textbook' }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/backend connection/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Demo listing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Verified student').length).toBeGreaterThan(0);

    const dealsSection = screen.getByRole('region', { name: 'Student Deals' });
    expect(within(dealsSection).getByRole('heading', { name: 'Engineering Mathematics textbook' })).toBeInTheDocument();
    expect(within(dealsSection).getByText('Student deal')).toBeInTheDocument();
    expect(within(dealsSection).queryByRole('heading', { name: 'Free badminton racket' })).not.toBeInTheDocument();
  });

  it('filters real listings by search and category and toggles a wishlist button', async () => {
    const { unmount } = renderHome();
    await screen.findByRole('heading', { name: 'Recently Listed' });

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search campus listings' }), {
      target: { value: 'mathematics' },
    });
    expect(await screen.findByRole('heading', { name: 'Search results' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Free badminton racket' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search campus listings' }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Free Items' }));
    expect(await screen.findByRole('heading', { name: 'Free Items on campus' })).toBeInTheDocument();
    const freeItemHeading = screen.getAllByRole('heading', { name: 'Free badminton racket' })[0];

    const card = freeItemHeading.closest('article');
    const wishlistButton = within(card).getByRole('button', { name: 'Add Free badminton racket to wishlist' });
    fireEvent.click(wishlistButton);
    expect(wishlistButton).toHaveAttribute('aria-pressed', 'true');

    unmount();
    renderHome();
    await screen.findByRole('heading', { name: 'Recently Listed' });
    const reloadedItemHeading = screen.getAllByRole('heading', { name: 'Free badminton racket' })[0];
    const reloadedCard = reloadedItemHeading.closest('article');
    expect(within(reloadedCard).getByRole('button', { name: 'Remove Free badminton racket from wishlist' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('sends sort and page selections to the paginated listings API', async () => {
    vi.mocked(searchListings).mockImplementation(async ({ page }) => ({
      items: listings,
      page,
      size: 8,
      totalElements: 20,
      totalPages: 3,
      first: page === 0,
      last: page === 2,
    }));
    renderHome();
    await screen.findByRole('heading', { name: 'Recently Listed' });

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort listings' }), {
      target: { value: 'price_asc' },
    });
    await waitFor(() => expect(searchListings).toHaveBeenLastCalledWith(expect.objectContaining({
      sort: 'price_asc',
      page: 0,
      size: 8,
    })));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(searchListings).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, sort: 'price_asc' }));
  });
});
