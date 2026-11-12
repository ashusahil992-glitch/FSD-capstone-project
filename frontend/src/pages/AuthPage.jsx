import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { setCredentials } from '../redux/authSlice.js';
import { loginAccount, registerAccount } from '../services/authService.js';
import { fetchUniversities } from '../services/universityService.js';

const quickDemoAccounts = [
  { label: 'Student (Aarav)', email: 'aarav.mehta@chitkara.edu.in', password: 'Student@123' },
  { label: 'Student (Isha)', email: 'isha.nair@chitkara.edu.in', password: 'Student@123' },
];

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authenticated = useSelector((state) => Boolean(state.auth?.token && state.auth?.user));
  const universitiesRequest = useFetch(fetchUniversities);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    studentId: '',
    universityId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setSubmitting(false);
  }, [mode]);

  if (authenticated) return <Navigate to="/" replace />;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function fillDemoAccount(account) {
    setForm((current) => ({ ...current, email: account.email, password: account.password }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = isRegister
        ? await registerAccount({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          studentId: form.studentId.trim(),
          universityId: Number(form.universityId),
        })
        : await loginAccount({ email: form.email.trim(), password: form.password });

      dispatch(setCredentials({ token: response.accessToken, user: response.user }));
      toast.success(isRegister ? 'Account created. Student verification is pending.' : 'Welcome back!');
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.userMessage || 'Could not complete your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
          <p className="mt-7 text-sm font-semibold uppercase tracking-wider text-indigo-700">CampusBazaar</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {isRegister ? 'Join your campus' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isRegister
              ? 'Create a student account to start buying, selling, and posting on your university board.'
              : 'Sign in to your student marketplace account.'}
          </p>

          {!isRegister && (
            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5">
              <p className="text-xs font-semibold text-indigo-900">Quick-fill seeded campus accounts:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickDemoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemoAccount(acc)}
                    className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-600 hover:text-white"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="mt-5"><ErrorState message={error} /></div>}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div>
                  <label htmlFor="auth-fullName" className="mb-1.5 block text-sm font-semibold text-slate-800">Full name</label>
                  <input
                    id="auth-fullName"
                    name="fullName"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={updateField}
                    required
                    maxLength={120}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label htmlFor="auth-universityId" className="mb-1.5 block text-sm font-semibold text-slate-800">University</label>
                  {universitiesRequest.loading && <Loading lines={1} />}
                  {universitiesRequest.error && <ErrorState message={universitiesRequest.error} onRetry={universitiesRequest.reload} />}
                  {universitiesRequest.data && (
                    <select
                      id="auth-universityId"
                      name="universityId"
                      value={form.universityId}
                      onChange={updateField}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="" disabled>Select your university</option>
                      {universitiesRequest.data.map((university) => (
                        <option key={university.id} value={university.id}>{university.name} — {university.city}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label htmlFor="auth-studentId" className="mb-1.5 block text-sm font-semibold text-slate-800">Student ID</label>
                  <input
                    id="auth-studentId"
                    name="studentId"
                    autoComplete="off"
                    value={form.studentId}
                    onChange={updateField}
                    required
                    maxLength={50}
                    placeholder="e.g. 2210990412"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">Masked on your profile; only last 4 digits are shown to admins for verification.</p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-800">Email</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={updateField}
                required
                maxLength={180}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-slate-800">Password</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={updateField}
                required
                minLength={isRegister ? 8 : undefined}
                maxLength={64}
                aria-describedby={isRegister ? 'password-guidance' : undefined}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              {isRegister && <p id="password-guidance" className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || (isRegister && (!universitiesRequest.data || universitiesRequest.loading))}
              className="btn-primary w-full rounded-xl py-3 font-semibold disabled:opacity-60"
            >
              {submitting ? 'Please wait…' : isRegister ? 'Create student account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? 'Already have an account?' : 'New to CampusBazaar?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-indigo-700 hover:text-indigo-900">
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
