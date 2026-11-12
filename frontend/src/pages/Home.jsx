import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import ProductCard from '../components/ProductCard.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchListings, searchListings } from '../services/listingService.js';

const categories = [
  { name: 'Books', icon: '📚', slug: 'academic', terms: ['book', 'academic', 'textbook', 'calculator'] },
  { name: 'Electronics', icon: '💻', slug: 'electronics', terms: ['electronic', 'laptop', 'headphone', 'guitar'] },
  { name: 'Hostel Essentials', icon: '🛏️', slug: 'hostel', terms: ['hostel', 'bedsheet', 'comforter', 'lamp'] },
  { name: 'Furniture', icon: '🪑', slug: 'hostel', terms: ['furniture', 'table', 'chair', 'desk'] },
  { name: 'Fashion', icon: '👕', slug: 'fashion', terms: ['fashion', 'clothes', 'backpack', 'shoes'] },
  { name: 'Sports', icon: '🏸', slug: 'sports-and-fitness', terms: ['sport', 'badminton', 'racket', 'bicycle'] },
  { name: 'Appliances', icon: '🔌', slug: 'appliances', terms: ['appliance', 'kettle', 'fan', 'induction'] },
  { name: 'Free Items', icon: '🎁', listingType: 'GIVEAWAY', terms: [] },
];

const typePills = [
  { label: 'All listings', value: '' },
  { label: 'For Sale', value: 'SALE' },
  { label: 'Semester Rent', value: 'RENT' },
  { label: 'Exchange', value: 'EXCHANGE' },
  { label: 'Free Giveaway', value: 'GIVEAWAY' },
];

const budgetPills = [
  { label: 'Any price', value: '' },
  { label: 'Under ₹500', value: '500' },
  { label: 'Under ₹1,000', value: '1000' },
  { label: 'Under ₹2,000', value: '2000' },
];

function matchesCategory(listing, category) {
  if (!category) return true;
  if (category.name === 'Free Items') return listing.listingType === 'GIVEAWAY';

  const listingText = [
    listing.title,
    listing.description,
    listing.category?.name,
    listing.category?.slug,
  ].join(' ').toLowerCase();
  return category.terms.some((term) => listingText.includes(term));
}

function ListingSection({ id, title, subtitle, listings, actionLabel }) {
  if (listings.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-24 py-10" aria-labelledby={`${id}-heading`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <a href="#recently-listed" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
          {actionLabel || 'Explore listings'} <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {listings.map((listing) => <ProductCard key={listing.id} listing={listing} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const listingsRequest = useFetch(fetchListings);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);

  const searchFetcher = useCallback(() => {
    const params = {
      q: search.trim() || undefined,
      category: activeCategory?.slug,
      listingType: typeFilter || activeCategory?.listingType,
      sort: sortBy,
      page,
      size: 8,
    };
    if (maxPrice) params.maxPrice = Number(maxPrice);
    if (conditionFilter) params.condition = conditionFilter;
    return searchListings(params);
  }, [search, activeCategory, typeFilter, maxPrice, conditionFilter, sortBy, page]);

  const searchRequest = useFetch(searchFetcher);

  const filteredListings = useMemo(() => {
    const listings = listingsRequest.data || [];
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesSearch = !query || [
        listing.title,
        listing.description,
        listing.category?.name,
        listing.seller?.name,
      ].join(' ').toLowerCase().includes(query);
      return matchesSearch && matchesCategory(listing, activeCategory);
    });
  }, [listingsRequest.data, search, activeCategory]);

  const budgetFinds = filteredListings.filter((listing) => Number(listing.price) <= 1000);
  const popularItems = filteredListings.filter((listing) => listing.popular);
  const studentDeals = filteredListings.filter((listing) => listing.studentDeal);
  const hostelClearance = filteredListings.filter((listing) => listing.hostelClearance);
  const hasActiveFilters = Boolean(search.trim() || activeCategory || typeFilter || maxPrice || conditionFilter);

  function exploreListings(event) {
    event.preventDefault();
    document.getElementById('recently-listed')?.scrollIntoView({ behavior: 'smooth' });
  }

  function resetAllFilters() {
    setSearch('');
    setActiveCategory(null);
    setTypeFilter('');
    setMaxPrice('');
    setConditionFilter('');
    setPage(0);
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_25%,rgba(99,102,241,0.42),transparent_42%),radial-gradient(ellipse_at_15%_85%,rgba(16,185,129,0.22),transparent_38%)]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Peer-to-peer university marketplace
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your Campus.<br /><span className="bg-gradient-to-r from-indigo-300 via-violet-200 to-emerald-200 bg-clip-text text-transparent">Your Marketplace.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Buy second-hand textbooks, rent lab gear or instruments for the semester, clear out your hostel room before graduation, and connect directly with verified students on your campus.
            </p>

            <form onSubmit={exploreListings} role="search" className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30 sm:flex-row">
              <label className="sr-only" htmlFor="marketplace-search">Search campus listings</label>
              <input
                id="marketplace-search"
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                placeholder="Search B.S. Grewal, scientific calculator, desk lamp, headphones..."
                className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="btn-primary rounded-xl px-6 py-3 font-semibold">
                Search marketplace
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#recently-listed" className="btn-primary bg-indigo-500 px-5 py-3 hover:bg-indigo-400">
                Explore Marketplace <span className="ml-2" aria-hidden="true">→</span>
              </a>
              <Link to="/sell" className="btn border border-white/25 bg-white/5 px-5 py-3 text-white hover:bg-white/10">
                Sell an Item
              </Link>
              <Link to="/campus-board" className="btn border border-white/25 bg-white/5 px-5 py-3 text-white hover:bg-white/10">
                Lost &amp; Found Board
              </Link>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6 text-left">
              <div>
                <dt className="text-xs text-slate-400">Active Listings</dt>
                <dd className="mt-0.5 text-xl font-bold text-white">{listingsRequest.data?.length || 10}+ items</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Partner Campuses</dt>
                <dd className="mt-0.5 text-xl font-bold text-indigo-300">5 Universities</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Platform Commission</dt>
                <dd className="mt-0.5 text-xl font-bold text-emerald-300">0% Forever</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden min-h-[370px] lg:block" aria-hidden="true">
            <div className="absolute right-4 top-4 w-64 rotate-3 rounded-3xl border border-white/15 bg-white/10 p-3.5 shadow-2xl backdrop-blur">
              <div className="flex h-40 flex-col justify-between rounded-2xl bg-gradient-to-br from-indigo-500/80 to-slate-900 p-4">
                <span className="w-fit rounded-full bg-amber-300/90 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-950">Student deal</span>
                <div>
                  <p className="text-2xl">🎧</p>
                  <p className="mt-1 text-sm font-bold text-white">Sony WH-CH720N ANC</p>
                  <p className="text-xs text-indigo-200">Nightingale Hostel · Like new</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-2 pt-3">
                <span className="text-xs font-medium text-emerald-300">✓ Verified Student</span>
                <span className="text-base font-extrabold text-white">₹1,800</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-2 w-64 -rotate-3 rounded-3xl border border-white/15 bg-white/10 p-3.5 shadow-2xl backdrop-blur">
              <div className="flex h-36 flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-500/80 to-teal-950 p-4">
                <span className="w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white">Semester Book</span>
                <div>
                  <p className="text-2xl">📚</p>
                  <p className="mt-1 text-sm font-bold text-white">B.S. Grewal Engg. Maths</p>
                  <p className="text-xs text-emerald-100">Archimedes Hostel · Good</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-2 pt-3">
                <span className="text-xs font-medium text-emerald-300">✓ Handover at Library</span>
                <span className="text-base font-extrabold text-white">₹450</span>
              </div>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 shadow-xl">
              <p className="text-xs text-slate-300">Sustainable campus living</p>
              <p className="mt-0.5 text-sm font-semibold text-emerald-300">Pass it on to the next batch ♻️</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section id="categories" className="scroll-mt-24 pt-12 pb-6 sm:pt-16" aria-labelledby="category-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Browse by category</p>
              <h2 id="category-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Find your campus essentials</h2>
            </div>
            {activeCategory && (
              <button type="button" className="text-sm font-semibold text-brand-700 hover:text-brand-900" onClick={() => { setActiveCategory(null); setPage(0); }}>
                Clear {activeCategory.name} filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                aria-pressed={activeCategory?.name === category.name}
                onClick={() => {
                  setActiveCategory(activeCategory?.name === category.name ? null : category);
                  setPage(0);
                }}
                className={`group flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  activeCategory?.name === category.name
                    ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <span className="text-3xl transition group-hover:scale-110" aria-hidden="true">{category.icon}</span>
                <span className="text-xs font-semibold sm:text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section id="recently-listed" className="scroll-mt-24 py-6" aria-label="Marketplace listings">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by listing type">
                {typePills.map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => { setTypeFilter(pill.value); setPage(0); }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      typeFilter === pill.value
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-medium text-slate-600">
                  Budget
                  <select
                    aria-label="Filter by budget"
                    value={maxPrice}
                    onChange={(event) => { setMaxPrice(event.target.value); setPage(0); }}
                    className="ml-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {budgetPills.map((b) => <option key={b.label} value={b.value}>{b.label}</option>)}
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Condition
                  <select
                    aria-label="Filter by condition"
                    value={conditionFilter}
                    onChange={(event) => { setConditionFilter(event.target.value); setPage(0); }}
                    className="ml-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <option value="">All conditions</option>
                    <option value="LIKE_NEW">Like new</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  Sort by
                  <select
                    aria-label="Sort listings"
                    value={sortBy}
                    onChange={(event) => { setSortBy(event.target.value); setPage(0); }}
                    className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 sm:text-sm"
                  >
                    <option value="newest">Recently listed</option>
                    <option value="popular">Popular first</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3">
              <p className="text-xs text-slate-600 sm:text-sm" aria-live="polite">
                {search.trim() ? <>Showing results for <strong>&ldquo;{search.trim()}&rdquo;</strong></>
                  : activeCategory ? <>Browsing <strong>{activeCategory.name}</strong></>
                  : 'Fresh finds from your campus community'}
                {searchRequest.data?.totalElements != null && (
                  <span className="ml-2 rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {searchRequest.data.totalElements} {searchRequest.data.totalElements === 1 ? 'item' : 'items'}
                  </span>
                )}
              </p>
              {hasActiveFilters && (
                <button type="button" onClick={resetAllFilters} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">
                  Reset all filters
                </button>
              )}
            </div>
          </div>

          {searchRequest.loading && <div className="card"><Loading lines={4} /></div>}
          {searchRequest.error && <ErrorState message={searchRequest.error} onRetry={searchRequest.reload} />}
          {!searchRequest.loading && searchRequest.data && searchRequest.data.items.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-3xl" aria-hidden="true">🔎</p>
              <h2 id="recent-heading" className="mt-3 text-xl font-bold text-slate-900">No listings match just yet</h2>
              <p className="mt-2 text-sm text-slate-500">Try another search or browse a different category.</p>
              <button type="button" className="btn-secondary mt-5" onClick={resetAllFilters}>
                Clear search and filters
              </button>
            </div>
          )}
          {!searchRequest.loading && searchRequest.data?.items.length > 0 && (
            <ListingSection
              id="recent-listings-grid"
              title={activeCategory ? `${activeCategory.name} on campus` : search.trim() ? 'Search results' : 'Recently Listed'}
              subtitle="Verified listings posted by students across campus"
              listings={searchRequest.data.items}
            />
          )}
          {!searchRequest.loading && searchRequest.data?.totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Listing pages">
              <button
                type="button"
                className="btn-secondary"
                disabled={searchRequest.data.first}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </button>
              <span className="text-sm font-medium text-slate-600" aria-live="polite">
                Page {searchRequest.data.page + 1} of {searchRequest.data.totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={searchRequest.data.last}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </section>

        {listingsRequest.data && !search.trim() && !activeCategory && !typeFilter && !maxPrice && !conditionFilter && (
          <>
            <ListingSection id="popular-items" title="Popular Items" subtitle="High-demand essentials going fast this semester" listings={popularItems.slice(0, 4)} />
            <ListingSection id="budget-finds" title="Budget Finds" subtitle="Useful student gear at ₹1,000 or under" listings={budgetFinds.slice(0, 4)} />
            <ListingSection id="student-deals" title="Student Deals" subtitle="Extra value on textbooks, calculators, and electronics" listings={studentDeals.slice(0, 4)} />
            <ListingSection id="hostel-clearance" title="Hostel Clearance" subtitle="Room essentials from graduating seniors" listings={hostelClearance.slice(0, 4)} />
          </>
        )}

        <section id="safety" className="my-10 scroll-mt-24 rounded-3xl bg-emerald-50 px-6 py-10 sm:px-10 sm:py-12" aria-labelledby="safety-heading">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-800">Good deals. Good sense.</p>
              <h2 id="safety-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Campus handovers made simple.</h2>
              <p className="mt-3 text-slate-600">Every exchange happens directly between students on campus — no middleman fees or shipping delays.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm"><span className="text-2xl" aria-hidden="true">🎓</span><h3 className="mt-3 font-semibold text-slate-900">Check the student</h3><p className="mt-1 text-sm leading-6 text-slate-600">Look for the verified student badge and chat directly inside CampusBazaar.</p></div>
              <div className="rounded-2xl bg-white p-5 shadow-sm"><span className="text-2xl" aria-hidden="true">🤝</span><h3 className="mt-3 font-semibold text-slate-900">Meet on campus</h3><p className="mt-1 text-sm leading-6 text-slate-600">Pick a familiar spot like the Central Library, student center, or hostel gate.</p></div>
              <div className="rounded-2xl bg-white p-5 shadow-sm"><span className="text-2xl" aria-hidden="true">🔍</span><h3 className="mt-3 font-semibold text-slate-900">Inspect before paying</h3><p className="mt-1 text-sm leading-6 text-slate-600">Test electronics or flip through textbooks in person before paying via UPI or cash.</p></div>
            </div>
          </div>
        </section>

        <section className="my-12 flex flex-col items-start justify-between gap-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-700 p-7 text-white shadow-lg sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Done with this semester&apos;s books?</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Turn unused hostel gear into cash in 60 seconds</h2>
            <p className="mt-2 max-w-xl text-sm text-indigo-100 sm:text-base">List textbooks, calculators, cycles, or study tables for fellow students on your campus.</p>
          </div>
          <Link to="/sell" className="btn bg-white px-6 py-3 font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 shrink-0 rounded-xl">
            List an item <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </>
  );
}
