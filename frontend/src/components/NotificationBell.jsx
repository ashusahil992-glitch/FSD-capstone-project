import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../services/messagingService.js';

export default function NotificationBell() {
  const token = useSelector((state) => state.auth?.token);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState({ items: [], unreadCount: 0 });
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setNotifications(await fetchNotifications());
      setError('');
    } catch (requestError) {
      setError(requestError.userMessage || 'Could not load notifications.');
    }
  }, [token]);

  useEffect(() => {
    setNotifications({ items: [], unreadCount: 0 });
    if (!token) return undefined;
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, [token, refresh]);

  async function handleMarkAllRead() {
    try {
      setNotifications(await markAllNotificationsRead());
      setError('');
    } catch (requestError) {
      setError(requestError.userMessage || 'Could not update notifications.');
    }
  }

  async function handleOpenNotification(notification) {
    setOpen(false);
    if (notification.readAt) return;
    try {
      setNotifications(await markNotificationRead(notification.id));
      setError('');
    } catch (requestError) {
      setError(requestError.userMessage || 'Could not update this notification.');
    }
  }

  if (!token) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${notifications.unreadCount ? `, ${notifications.unreadCount} unread` : ''}`}
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value); refresh(); }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {notifications.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm">
            {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl" aria-label="Notifications">
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            {notifications.unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">
                Mark all read
              </button>
            )}
          </div>
          {error && <p role="alert" className="px-2 py-3 text-sm text-red-700">{error}</p>}
          {!error && notifications.items.length === 0 && (
            <p className="px-2 py-5 text-sm text-slate-500">You’re all caught up.</p>
          )}
          <ul className="mt-2 max-h-80 overflow-y-auto">
            {notifications.items.map((notification) => (
              <li key={notification.id}>
                <Link
                  to={`/messages/${notification.conversationId}`}
                  onClick={() => handleOpenNotification(notification)}
                  className={`block rounded-xl px-3 py-3 hover:bg-slate-50 ${notification.readAt ? '' : 'bg-indigo-50/70'}`}
                >
                  <span className="block text-sm font-medium text-slate-800">{notification.message}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{notification.listingTitle}</span>
                  <time className="mt-1 block text-[11px] text-slate-400" dateTime={notification.createdAt}>
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.createdAt))}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
