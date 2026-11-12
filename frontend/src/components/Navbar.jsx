import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice.js';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.auth?.user);
  const wishlistCount = useSelector((state) => state.wishlist?.ids?.length || 0);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900" aria-label="CampusBazaar home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-extrabold text-white shadow-sm" aria-hidden="true">C</span>
          <span>Campus<span className="text-indigo-600">Bazaar</span></span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          <Link to="/" className={`text-sm font-medium transition hover:text-indigo-700 ${isActive('/') ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}>Marketplace</Link>
          <a href="/#categories" className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">Categories</a>
          <a href="/#student-deals" className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">Student Deals</a>
          <Link to="/campus-board" className={`text-sm font-medium transition hover:text-indigo-700 ${isActive('/campus-board') ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}>Campus Board</Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/wishlist"
            aria-label={`Saved items${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
            className={`relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              isActive('/wishlist')
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className={wishlistCount > 0 ? 'text-rose-500' : 'text-slate-400'} aria-hidden="true">♥</span>
            <span className="hidden sm:inline">Saved</span>
            {wishlistCount > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">
                {wishlistCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="rounded-lg bg-indigo-50 px-2.5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                  Admin
                </Link>
              )}
              <Link to="/my-listings" className="hidden rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline-flex">
                My Listings
              </Link>
              <Link to="/messages" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Messages
              </Link>
              <Link to="/campus-board" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 lg:hidden">
                Campus board
              </Link>
              <NotificationBell />
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 sm:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'S'}
                </span>
                <span className="max-w-28 truncate text-xs font-semibold text-slate-700">{user.fullName}</span>
              </div>
              <button type="button" onClick={() => dispatch(logout())} className="btn-secondary px-3 py-2 text-xs sm:text-sm">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/campus-board" className="hidden rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex lg:hidden">
                Campus board
              </Link>
              <Link to="/login" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-3">
                Sign in
              </Link>
              <Link to="/register" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline-flex">
                Join
              </Link>
            </>
          )}
          <Link to="/sell" aria-label="Sell an item" className="btn-primary rounded-xl px-3.5 py-2.5 shadow-sm sm:px-4">
            <span className="mr-1 font-bold" aria-hidden="true">+</span>
            <span className="hidden sm:inline">Sell an item</span>
            <span className="sm:hidden">Sell</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
