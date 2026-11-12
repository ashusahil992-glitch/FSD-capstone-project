import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { deleteListing, fetchMyListings, updateListingStatus } from '../services/listingService.js';
import { formatPrice } from '../utils/format.js';

export default function MyListings() {
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.auth?.user);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busyId, setBusyId] = useState(null);

  const loadMine = useCallback(() => (token ? fetchMyListings() : Promise.resolve([])), [token]);
  const listingsRequest = useFetch(loadMine);

  const items = useMemo(() => listingsRequest.data || [], [listingsRequest.data]);
  const filteredItems = useMemo(
    () => items.filter((item) => statusFilter === 'ALL' || item.status === statusFilter),
    [items, statusFilter],
  );

  const stats = useMemo(() => {
    const available = items.filter((i) => i.status === 'AVAILABLE');
    const sold = items.filter((i) => i.status === 'SOLD');
    const activeValue = available.reduce((sum, i) => sum + Number(i.price || 0), 0);
    return {
      total: items.length,
      available: available.length,
      sold: sold.length,
      activeValue,
    };
  }, [items]);

  async function handleToggleStatus(listing) {
    const nextStatus = listing.status === 'SOLD' ? 'AVAILABLE' : 'SOLD';
    setBusyId(listing.id);
    try {
      await updateListingStatus(listing.id, nextStatus);
      toast.success(nextStatus === 'SOLD' ? 'Marked as sold!' : 'Relisted as available!');
      listingsRequest.reload();
    } catch (error) {
      toast.error(error.userMessage || 'Could not update status.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(listing) {
    if (!window.confirm(`Remove "${listing.title}" from the marketplace?`)) return;
    setBusyId(listing.id);
    try {
      await deleteListing(listing.id);
      toast.success('Listing removed.');
      listingsRequest.reload();
    } catch (error) {
      toast.error(error.userMessage || 'Could not remove listing.');
    } finally {
      setBusyId(null);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to manage your listings</h1>
        <p className="mt-2 text-sm text-slate-600">Track items you are selling, mark handovers as sold, or update prices.</p>
        <Link to="/login" className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3">Sign in</Link>
      </div>
    );
  }

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Seller workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">My Campus Listings</h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as <strong>{user?.fullName}</strong> {user?.university ? `· ${user.university}` : ''}
            </p>
          </div>
          <Link to="/sell" className="btn-primary rounded-xl px-5 py-3 font-semibold">
            + List another item
          </Link>
        </div>

        <section className="mt-7 grid grid-cols-2 gap-3.5 sm:grid-cols-4" aria-label="Seller summary">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Posted</p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Active on Campus</p>
            <p className="mt-1.5 text-2xl font-extrabold text-emerald-700">{stats.available}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Handed Over / Sold</p>
            <p className="mt-1.5 text-2xl font-extrabold text-indigo-700">{stats.sold}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Active Inventory Value</p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900">{formatPrice(stats.activeValue)}</p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {['ALL', 'AVAILABLE', 'SOLD'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL' ? 'All Items' : status === 'AVAILABLE' ? 'Available' : 'Sold'}
              </button>
            ))}
          </div>
        </div>

        {listingsRequest.loading && <div className="mt-6 card"><Loading lines={4} /></div>}
        {listingsRequest.error && <div className="mt-6"><ErrorState message={listingsRequest.error} onRetry={listingsRequest.reload} /></div>}

        {!listingsRequest.loading && !listingsRequest.error && filteredItems.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl" aria-hidden="true">📦</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">No listings in this view yet</h2>
            <p className="mt-2 text-sm text-slate-500">Post textbooks, electronics, or hostel essentials to connect with buyers on your campus.</p>
            <Link to="/sell" className="btn-primary mt-5 inline-flex rounded-xl px-5 py-2.5">Create your first listing</Link>
          </div>
        )}

        {!listingsRequest.loading && filteredItems.length > 0 && (
          <div className="mt-6 space-y-4">
            {filteredItems.map((listing) => {
              const isSold = listing.status === 'SOLD';
              return (
                <article
                  key={listing.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {listing.imageUrl ? (
                        <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">{listing.category?.icon || '🛍️'}</div>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                          isSold ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {listing.status}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{listing.category?.name}</span>
                      </div>
                      <h2 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                        <Link to={`/listings/${listing.id}`} className="hover:text-indigo-700">{listing.title}</Link>
                      </h2>
                      <p className="mt-1 text-sm font-extrabold text-slate-900">{formatPrice(Number(listing.price))}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === listing.id}
                      onClick={() => handleToggleStatus(listing)}
                      className="btn-secondary rounded-xl px-3.5 py-2 text-xs font-semibold"
                    >
                      {isSold ? 'Mark Available' : '✓ Mark as Sold'}
                    </button>
                    <Link to={`/listings/${listing.id}/edit`} className="btn-secondary rounded-xl px-3.5 py-2 text-xs font-semibold">
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === listing.id}
                      onClick={() => handleRemove(listing)}
                      className="btn-secondary rounded-xl border-red-200 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
