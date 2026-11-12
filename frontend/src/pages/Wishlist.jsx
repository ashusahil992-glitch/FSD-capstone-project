import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import ProductCard from '../components/ProductCard.jsx';
import useFetch from '../hooks/useFetch.js';
import { clearWishlist } from '../redux/wishlistSlice.js';
import { fetchListings } from '../services/listingService.js';
import { formatPrice } from '../utils/format.js';

export default function Wishlist() {
  const dispatch = useDispatch();
  const wishlistIds = useSelector((state) => state.wishlist?.ids || []);
  const listingsRequest = useFetch(fetchListings);

  const savedListings = useMemo(() => {
    const all = listingsRequest.data || [];
    const idSet = new Set(wishlistIds.map((id) => String(id)));
    return all.filter((item) => idSet.has(String(item.id)));
  }, [listingsRequest.data, wishlistIds]);

  const totalValue = useMemo(
    () => savedListings.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [savedListings],
  );

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Saved Campus Finds</h1>
            <p className="mt-1 text-sm text-slate-600">
              {savedListings.length > 0
                ? `${savedListings.length} saved ${savedListings.length === 1 ? 'item' : 'items'} · Combined value ${formatPrice(totalValue)}`
                : 'Keep track of textbooks, electronics, and hostel deals you are interested in.'}
            </p>
          </div>
          {wishlistIds.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(clearWishlist())}
              className="btn-secondary rounded-xl px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              Clear saved items
            </button>
          )}
        </div>

        {listingsRequest.loading && <div className="mt-8 card"><Loading lines={4} /></div>}
        {listingsRequest.error && <div className="mt-8"><ErrorState message={listingsRequest.error} onRetry={listingsRequest.reload} /></div>}

        {!listingsRequest.loading && !listingsRequest.error && savedListings.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl text-rose-500" aria-hidden="true">♡</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">Your wishlist is empty</h2>
            <p className="mt-2 text-sm text-slate-500">Tap the heart icon on any marketplace listing to save it here for quick comparison.</p>
            <Link to="/" className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3">Explore marketplace</Link>
          </div>
        )}

        {!listingsRequest.loading && savedListings.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {savedListings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
