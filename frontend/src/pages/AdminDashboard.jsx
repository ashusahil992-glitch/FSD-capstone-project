import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import {
  fetchAdminDashboard,
  fetchAdminListings,
  fetchAdminReports,
  fetchAdminUsers,
  moderateListing,
  reinstateUser,
  reviewReport,
  suspendUser,
  verifyStudent,
} from '../services/adminService.js';
import { formatPrice } from '../utils/format.js';

const metricLabels = {
  totalUsers: 'Total accounts',
  pendingStudentVerification: 'Pending student checks',
  verifiedStudents: 'Verified students',
  suspendedUsers: 'Suspended accounts',
  totalListings: 'Total listings',
  availableListings: 'Available listings',
  removedListings: 'Removed listings',
  openReports: 'Open reports',
};

export default function AdminDashboard() {
  const user = useSelector((state) => state.auth.user);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyAction, setBusyAction] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, userRows, listingRows, reportRows] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminUsers(),
        fetchAdminListings(),
        fetchAdminReports(),
      ]);
      setDashboard(summary);
      setUsers(userRows);
      setListings(listingRows);
      setReports(reportRows);
    } catch (requestError) {
      setError(requestError.userMessage || 'Could not load the admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadDashboard();
  }, [user?.role, loadDashboard]);

  async function runAction(key, action) {
    setBusyAction(key);
    setActionError('');
    try {
      await action();
      await loadDashboard();
    } catch (requestError) {
      setActionError(requestError.userMessage || 'The admin action could not be completed.');
    } finally {
      setBusyAction('');
    }
  }

  if (user?.role !== 'ADMIN') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin access required</h1>
        <p className="mt-3 text-sm text-slate-600">This dashboard is available only to authorized administrators.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3">Back to marketplace</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">CampusBazaar administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Admin dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Review accounts, moderate listings, and resolve student reports.</p>
        </div>
        <button type="button" onClick={loadDashboard} disabled={loading} className="btn-secondary rounded-xl px-4 py-2.5 disabled:opacity-60">
          Refresh dashboard
        </button>
      </div>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={loadDashboard} /></div>}
      {actionError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{actionError}</p>}
      {loading && !dashboard && <div className="mt-6"><Loading lines={5} /></div>}

      {dashboard && (
        <>
          <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Marketplace analytics">
            {Object.entries(metricLabels).map(([key, label]) => (
              <article key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium leading-5 text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{dashboard[key]}</p>
              </article>
            ))}
          </section>

          <section className="mt-10" aria-labelledby="admin-users-heading">
            <h2 id="admin-users-heading" className="text-xl font-bold text-slate-900">Student accounts</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">University</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((account) => (
                    <tr key={account.id}>
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-slate-800">{account.fullName}</span>
                        <span className="text-xs text-slate-500">{account.email}{account.maskedStudentId ? ` · ID ${account.maskedStudentId}` : ''}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{account.university || '—'}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{account.status}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{account.studentVerified ? 'Student verified' : 'Pending review'}</td>
                      <td className="px-4 py-3">
                        {account.role !== 'ADMIN' && (
                          <div className="flex flex-wrap gap-2">
                            {!account.studentVerified && account.role === 'STUDENT' && (
                              <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction(`verify-${account.id}`, () => verifyStudent(account.id))}
                                className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50">Verify</button>
                            )}
                            {account.status === 'SUSPENDED' ? (
                              <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction(`reinstate-${account.id}`, () => reinstateUser(account.id))}
                                className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 disabled:opacity-50">Reinstate</button>
                            ) : (
                              <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction(`suspend-${account.id}`, () => suspendUser(account.id))}
                                className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 disabled:opacity-50">Suspend</button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="p-5 text-sm text-slate-500">No accounts found.</p>}
            </div>
          </section>

          <section className="mt-10" aria-labelledby="admin-listings-heading">
            <h2 id="admin-listings-heading" className="text-xl font-bold text-slate-900">Listing moderation</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Listing</th><th className="px-4 py-3">Seller</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listings.map((listing) => (
                    <tr key={listing.id}>
                      <td className="px-4 py-3"><Link to={`/listings/${listing.id}`} className="font-semibold text-indigo-700 hover:text-indigo-900">{listing.title}</Link><span className="block text-xs text-slate-500">{listing.category}{listing.demo ? ' · Demo' : ''}</span></td>
                      <td className="px-4 py-3 text-slate-600">{listing.sellerName}<span className="block text-xs">{listing.sellerEmail}</span></td>
                      <td className="px-4 py-3 text-slate-700">{formatPrice(Number(listing.price))}</td>
                      <td className="px-4 py-3">{listing.status}</td>
                      <td className="px-4 py-3">
                        {listing.status !== 'SOLD' && (
                          <button type="button" disabled={Boolean(busyAction)}
                            onClick={() => runAction(`listing-${listing.id}`, () => moderateListing(listing.id, listing.status === 'REMOVED' ? 'AVAILABLE' : 'REMOVED'))}
                            className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 disabled:opacity-50">
                            {listing.status === 'REMOVED' ? 'Restore' : 'Remove'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {listings.length === 0 && <p className="p-5 text-sm text-slate-500">No listings found.</p>}
            </div>
          </section>

          <section className="my-10" aria-labelledby="admin-reports-heading">
            <h2 id="admin-reports-heading" className="text-xl font-bold text-slate-900">Listing reports</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Listing</th><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Review</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-4 py-3"><Link to={`/listings/${report.listingId}`} className="font-semibold text-indigo-700 hover:text-indigo-900">{report.listingTitle}</Link></td>
                      <td className="px-4 py-3 text-slate-600">{report.reporterName}<span className="block text-xs">{report.reporterEmail}</span></td>
                      <td className="max-w-sm whitespace-pre-wrap px-4 py-3 text-slate-700">{report.reason}</td>
                      <td className="px-4 py-3">{report.status}</td>
                      <td className="px-4 py-3">
                        {report.status === 'OPEN' && (
                          <div className="flex gap-2">
                            <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction(`review-${report.id}`, () => reviewReport(report.id, 'REVIEWED'))}
                              className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 disabled:opacity-50">Reviewed</button>
                            <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction(`dismiss-${report.id}`, () => reviewReport(report.id, 'DISMISSED'))}
                              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50">Dismiss</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length === 0 && <p className="p-5 text-sm text-slate-500">No reports have been submitted.</p>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
