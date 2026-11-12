import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { toggleWishlist } from '../redux/wishlistSlice.js';
import { deleteListing, fetchListing, updateListingStatus } from '../services/listingService.js';
import { sendMessage, startConversation, submitListingReport } from '../services/messagingService.js';
import { formatPrice } from '../utils/format.js';

const conditionLabels = {
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
};

const listingTypeLabels = {
  SALE: 'For sale',
  RENT: 'For rent',
  EXCHANGE: 'Exchange',
  GIVEAWAY: 'Free item',
};

const quickPrompts = [
  'Hi! Is this still available?',
  'Can we meet near the library today to check it?',
  'Is the price slightly negotiable for a quick pickup?',
];

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.auth?.user);
  const wishlisted = useSelector((state) => (state.wishlist?.ids || []).some((wId) => String(wId) === String(id)));

  const loadListing = useCallback(() => fetchListing(id), [id]);
  const listingRequest = useFetch(loadListing);
  const [startingConversation, setStartingConversation] = useState(false);
  const [conversationError, setConversationError] = useState('');
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function messageSeller(initialText = '') {
    if (!token) {
      navigate('/login');
      return;
    }
    setStartingConversation(true);
    setConversationError('');
    try {
      const conversation = await startConversation(Number(id));
      if (initialText) {
        await sendMessage(conversation.id, initialText);
      }
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      setConversationError(error.userMessage || 'Could not start a conversation.');
    } finally {
      setStartingConversation(false);
    }
  }

  async function handleStatusToggle() {
    if (!listingRequest.data) return;
    const nextStatus = listingRequest.data.status === 'SOLD' ? 'AVAILABLE' : 'SOLD';
    setUpdatingStatus(true);
    setDeleteError('');
    try {
      await updateListingStatus(id, nextStatus);
      toast.success(nextStatus === 'SOLD' ? 'Marked as sold!' : 'Relisted as available!');
      listingRequest.reload();
    } catch (error) {
      setDeleteError(error.userMessage || 'Could not update listing status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    setReportSubmitting(true);
    setReportError('');
    try {
      await submitListingReport(Number(id), reportReason.trim());
      setReportSubmitted(true);
      setReportFormOpen(false);
      setReportReason('');
    } catch (error) {
      setReportError(error.userMessage || 'Could not submit this report.');
    } finally {
      setReportSubmitting(false);
    }
  }

  async function removeListing() {
    if (!window.confirm('Remove this listing from the marketplace?')) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteListing(id);
      navigate('/', { replace: true });
    } catch (error) {
      setDeleteError(error.userMessage || 'Could not remove this listing.');
    } finally {
      setDeleting(false);
    }
  }

  function handleShare() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Listing link copied to clipboard!');
    }
  }

  if (listingRequest.loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Loading lines={5} />
      </div>
    );
  }

  if (listingRequest.error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
        <div className="mt-6"><ErrorState message={listingRequest.error} onRetry={listingRequest.reload} /></div>
      </div>
    );
  }

  const listing = listingRequest.data;
  if (!listing) return null;
  const isOwner = user?.id != null && String(user.id) === String(listing.seller?.id);
  const isSold = listing.status === 'SOLD';

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(toggleWishlist(listing.id))}
              aria-pressed={wishlisted}
              className={`btn-secondary rounded-xl px-3.5 py-2 text-xs font-semibold ${wishlisted ? 'border-rose-200 bg-rose-50 text-rose-700' : ''}`}
            >
              <span className="mr-1.5" aria-hidden="true">{wishlisted ? '♥' : '♡'}</span>
              {wishlisted ? 'Saved to wishlist' : 'Save item'}
            </button>
            <button type="button" onClick={handleShare} className="btn-secondary rounded-xl px-3.5 py-2 text-xs font-semibold">
              Share link
            </button>
          </div>
        </div>

        <article className="mt-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
          <div className="relative min-h-72 bg-slate-100 sm:min-h-96">
            {listing.imageUrl ? (
              <img src={listing.imageUrl} alt={listing.title} className="h-full min-h-72 w-full object-cover sm:min-h-96" />
            ) : (
              <div className="flex h-full min-h-72 items-center justify-center text-7xl sm:min-h-96" aria-hidden="true">{listing.category?.icon || '🛍️'}</div>
            )}
            {isSold && (
              <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow">
                Sold Out
              </span>
            )}
            {!isSold && listing.demo && (
              <span className="absolute left-4 top-4 rounded-full bg-slate-900/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                Demo listing
              </span>
            )}
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{listing.category?.name || 'Campus find'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{listingTypeLabels[listing.listingType] || listing.listingType}</span>
              {listing.studentDeal && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Student deal</span>
              )}
              {listing.hostelClearance && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">Hostel clearance</span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">{listing.title}</h1>
            <p className="mt-4 flex items-baseline gap-2 text-3xl font-extrabold text-slate-900">
              <span>{formatPrice(Number(listing.price))}</span>
              {listing.listingType === 'RENT' && Number(listing.price) > 0 && (
                <span className="text-sm font-medium text-slate-500">per semester</span>
              )}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
                Condition: <strong className="font-semibold text-slate-800">{conditionLabels[listing.condition] || listing.condition}</strong>
              </span>
              {listing.seller?.verified && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                  ✓ Verified student
                </span>
              )}
            </div>

            <section className="mt-7 border-t border-slate-100 pt-6" aria-labelledby="description-heading">
              <h2 id="description-heading" className="text-lg font-semibold text-slate-900">About this item</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{listing.description}</p>
            </section>

            <section className="mt-7 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4" aria-labelledby="seller-heading">
              <h2 id="seller-heading" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Seller</h2>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{listing.seller?.name || 'Campus seller'}</p>
                  {(listing.seller?.university || listing.seller?.hostel) && (
                    <p className="mt-0.5 text-xs text-slate-600">
                      {[listing.seller.university, listing.seller.hostel].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {listing.createdAt && (
                    <p className="mt-1 text-xs text-slate-500">
                      Listed {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(listing.createdAt))}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {!isOwner && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => messageSeller()}
                  disabled={startingConversation || isSold}
                  className="btn-primary w-full rounded-xl px-5 py-3 font-semibold disabled:opacity-60"
                >
                  {isSold ? 'Item has been sold' : startingConversation ? 'Opening chat…' : 'Message seller'}
                </button>
                {!isSold && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500">Or send a quick campus inquiry:</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          disabled={startingConversation}
                          onClick={() => messageSeller(prompt)}
                          className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-2.5 py-1.5 text-left text-xs font-medium text-indigo-800 transition hover:bg-indigo-100"
                        >
                          &ldquo;{prompt}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {conversationError && <p role="alert" className="mt-2 text-sm text-red-700">{conversationError}</p>}
              </div>
            )}

            {isOwner && (
              <div className="mt-6 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-800">Manage your listing</p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleStatusToggle}
                    disabled={updatingStatus}
                    className="btn-secondary flex-1 justify-center border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  >
                    {updatingStatus ? 'Updating…' : isSold ? 'Relist as Available' : '✓ Mark as Sold'}
                  </button>
                  <Link to={`/listings/${listing.id}/edit`} className="btn-secondary flex-1 justify-center">
                    Edit listing
                  </Link>
                  <button
                    type="button"
                    onClick={removeListing}
                    disabled={deleting}
                    className="btn-secondary flex-1 justify-center border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deleting ? 'Removing…' : 'Delete listing'}
                  </button>
                </div>
              </div>
            )}
            {deleteError && <p role="alert" className="mt-2 text-sm text-red-700">{deleteError}</p>}

            <div className="mt-4">
              {reportSubmitted ? (
                <p role="status" className="text-sm font-medium text-emerald-800">Thanks. Your report has been sent to the moderation team.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => (token ? setReportFormOpen((open) => !open) : navigate('/login'))}
                  className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                >
                  Report this listing
                </button>
              )}
              {reportFormOpen && (
                <form onSubmit={submitReport} className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label htmlFor="listing-report-reason" className="block text-sm font-semibold text-slate-800">Why are you reporting this listing?</label>
                  <textarea
                    id="listing-report-reason"
                    required
                    minLength={5}
                    maxLength={1000}
                    rows="3"
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  {reportError && <p role="alert" className="mt-2 text-sm text-red-700">{reportError}</p>}
                  <button type="submit" disabled={reportSubmitting} className="btn-secondary mt-3 rounded-lg px-4 py-2 disabled:opacity-60">
                    {reportSubmitting ? 'Sending…' : 'Submit report'}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Arrange a safe on-campus handover and inspect the item before making payment.
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
