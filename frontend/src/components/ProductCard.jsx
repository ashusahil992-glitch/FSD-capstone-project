import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleWishlist } from '../redux/wishlistSlice.js';
import { formatPrice } from '../utils/format.js';

const conditionLabels = {
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
};

const listingTypeLabels = {
  SALE: null,
  RENT: 'For rent',
  EXCHANGE: 'Exchange',
  GIVEAWAY: 'Free',
};

export default function ProductCard({ listing }) {
  const dispatch = useDispatch();
  const wishlisted = useSelector((state) => (state.wishlist?.ids || []).some((id) => String(id) === String(listing.id)));
  const [imageFailed, setImageFailed] = useState(false);
  const listingTypeLabel = listingTypeLabels[listing.listingType];
  const detailsUrl = `/listings/${listing.id}`;
  const isSold = listing.status === 'SOLD';

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/5">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Link to={detailsUrl} aria-label={`View ${listing.title}`} className="block h-full w-full">
          {listing.imageUrl && !imageFailed ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${isSold ? 'opacity-60 grayscale' : ''}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/50 text-5xl" aria-hidden="true">
              {listing.category?.icon || '🛍️'}
            </div>
          )}
        </Link>
        <button
          type="button"
          aria-label={wishlisted ? `Remove ${listing.title} from wishlist` : `Add ${listing.title} to wishlist`}
          aria-pressed={wishlisted}
          onClick={() => dispatch(toggleWishlist(listing.id))}
          className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg shadow-sm backdrop-blur transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            wishlisted ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'
          }`}
        >
          <span aria-hidden="true">{wishlisted ? '♥' : '♡'}</span>
        </button>
        {isSold && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Sold
          </span>
        )}
        {!isSold && listing.demo && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-slate-900/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Demo listing
          </span>
        )}
        {!isSold && !listing.demo && listing.hostelClearance && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-emerald-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 backdrop-blur">
            Hostel clearance
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex min-h-5 items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-slate-500">{listing.category?.name || 'Campus find'}</span>
          {listing.seller?.verified && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:text-xs">
              <span aria-hidden="true">✓ </span>Verified student
            </span>
          )}
        </div>
        {listing.studentDeal && (
          <div className="mt-1.5">
            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
              Student deal
            </span>
          </div>
        )}
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 sm:text-base">
          <Link to={detailsUrl} className="hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {listing.title}
          </Link>
        </h3>
        <div className="mt-auto pt-2">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-extrabold text-slate-900 sm:text-lg">
              {formatPrice(Number(listing.price))}
              {listing.listingType === 'RENT' && Number(listing.price) > 0 && (
                <span className="ml-0.5 text-xs font-normal text-slate-500">/sem</span>
              )}
            </span>
            {listingTypeLabel && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                {listingTypeLabel}
              </span>
            )}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {conditionLabels[listing.condition] || listing.condition}
            </span>
            <span className="max-w-[60%] truncate text-right text-xs text-slate-500" title={listing.seller?.university || listing.seller?.name}>
              {listing.seller?.name || 'Campus seller'}
              {listing.seller?.hostel ? ` · ${listing.seller.hostel.replace(' Hostel', '')}` : ''}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
