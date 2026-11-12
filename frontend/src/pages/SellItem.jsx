import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { createListing, fetchListing, updateListing } from '../services/listingService.js';
import { fetchCategories } from '../services/categoryService.js';

const transactionTypes = [
  { value: 'SALE', label: 'Sell' },
  { value: 'RENT', label: 'Rent out' },
  { value: 'EXCHANGE', label: 'Exchange' },
  { value: 'GIVEAWAY', label: 'Give away' },
];

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export default function SellItem() {
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.auth?.user);
  const { id: listingId } = useParams();
  if (!token) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-4 py-14">
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Sign in to sell on campus</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Sign in with your student account to publish listings and chat with buyers on your campus.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login" className="btn-primary rounded-xl px-5 py-3">Sign in</Link>
            <Link to="/register" className="btn-secondary rounded-xl px-5 py-3">Create account</Link>
          </div>
        </section>
      </div>
    );
  }
  return <SellItemForm listingId={listingId} user={user} />;
}

function SellItemForm({ listingId, user }) {
  const navigate = useNavigate();
  const categoriesRequest = useFetch(fetchCategories);
  const listingFetcher = useCallback(() => (listingId ? fetchListing(listingId) : Promise.resolve(null)), [listingId]);
  const listingRequest = useFetch(listingFetcher);
  const [form, setForm] = useState({
    title: '',
    categorySlug: '',
    listingType: 'SALE',
    price: '',
    condition: '',
    description: '',
    imageUrl: '',
    studentDeal: false,
    hostelClearance: false,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const listing = listingRequest.data;
    if (!listing) return;
    const owner = String(listing.seller?.id) === String(user?.id);
    if (owner) {
      setForm({
        title: listing.title,
        categorySlug: listing.category?.slug || '',
        listingType: listing.listingType,
        price: Number(listing.price) > 0 ? String(listing.price) : '',
        condition: listing.condition,
        description: listing.description,
        imageUrl: listing.imageUrl || '',
        studentDeal: Boolean(listing.studentDeal),
        hostelClearance: Boolean(listing.hostelClearance),
      });
      if (listing.imageUrl) {
        setImagePreview(listing.imageUrl);
      }
    }
  }, [listingRequest.data, user?.id]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setRequestError('');
  }

  function handleImageChange(event) {
    const selectedImage = event.target.files?.[0] || null;
    setImageError('');
    if (!selectedImage) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedImage.type)) {
      setImageError('Choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (selectedImage.size > 5 * 1024 * 1024) {
      setImageError('Choose an image smaller than 5 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
        setForm((current) => ({ ...current, imageUrl: reader.result }));
      }
    };
    reader.readAsDataURL(selectedImage);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setRequestError('');
    if (imageError) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        categorySlug: form.categorySlug,
        listingType: form.listingType,
        condition: form.condition,
        price: form.listingType === 'GIVEAWAY' || form.listingType === 'EXCHANGE' ? 0 : Number(form.price),
      };
      if (form.imageUrl && form.imageUrl.trim()) {
        payload.imageUrl = form.imageUrl.trim();
      }
      if (form.studentDeal) {
        payload.studentDeal = true;
      }
      if (form.hostelClearance) {
        payload.hostelClearance = true;
      }

      const listing = listingId
        ? await updateListing(listingId, payload)
        : await createListing(payload);
      toast.success(listingId ? 'Your listing has been updated.' : 'Your listing is now live on campus!');
      navigate(`/listings/${listing.id}`, { replace: true });
    } catch (error) {
      setRequestError(error.userMessage || 'Could not save your listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const priceRequired = form.listingType === 'SALE' || form.listingType === 'RENT';

  if (listingId && listingRequest.loading) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><Loading lines={5} /></div>;
  }
  if (listingId && listingRequest.error) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message={listingRequest.error} onRetry={listingRequest.reload} /></div>;
  }
  if (listingId && listingRequest.data && String(listingRequest.data.seller?.id) !== String(user?.id)) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message="You can only edit your own listings." /></div>;
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Student seller studio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{listingId ? 'Edit your listing' : 'List an item'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Add clear details, choose a fair student price, and let buyers on your campus reach out via chat.
          </p>

          {requestError && <div className="mt-5"><ErrorState message={requestError} /></div>}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="listing-title" className="mb-2 block text-sm font-semibold text-slate-800">Item title <span aria-hidden="true">*</span></label>
                <input
                  id="listing-title"
                  name="title"
                  type="text"
                  maxLength={140}
                  required
                  value={form.title}
                  onChange={updateField}
                  placeholder="e.g. Casio FX-991EX ClassWiz Calculator or Engineering Maths Textbook"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="listing-category" className="mb-2 block text-sm font-semibold text-slate-800">Category <span aria-hidden="true">*</span></label>
                {categoriesRequest.loading && <Loading lines={1} />}
                {categoriesRequest.error && <ErrorState message={categoriesRequest.error} onRetry={categoriesRequest.reload} />}
                {categoriesRequest.data && (
                  <select id="listing-category" name="categorySlug" required value={form.categorySlug} onChange={updateField} className={inputClass}>
                    <option value="" disabled>Select a category</option>
                    {categoriesRequest.data.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.parentName ? `${category.parentName} / ${category.name}` : category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="listing-type" className="mb-2 block text-sm font-semibold text-slate-800">What would you like to do? <span aria-hidden="true">*</span></label>
                <select id="listing-type" name="listingType" value={form.listingType} onChange={updateField} className={inputClass}>
                  {transactionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>

              {priceRequired && (
                <div>
                  <label htmlFor="listing-price" className="mb-2 block text-sm font-semibold text-slate-800">
                    {form.listingType === 'RENT' ? 'Rent (₹)' : 'Price (₹)'} <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="listing-price"
                    name="price"
                    type="number"
                    min="0.01"
                    max="10000000"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={updateField}
                    placeholder="e.g. 500"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label htmlFor="listing-condition" className="mb-2 block text-sm font-semibold text-slate-800">Condition <span aria-hidden="true">*</span></label>
                <select id="listing-condition" name="condition" required value={form.condition} onChange={updateField} className={inputClass}>
                  <option value="" disabled>Select condition</option>
                  <option value="LIKE_NEW">Like new</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="listing-description" className="mb-2 block text-sm font-semibold text-slate-800">Description <span aria-hidden="true">*</span></label>
                <textarea
                  id="listing-description"
                  name="description"
                  rows="5"
                  maxLength={2000}
                  required
                  value={form.description}
                  onChange={updateField}
                  placeholder="Share the item's edition/model, condition, included accessories, and preferred pickup spot (e.g. Central Library or Hostel Gate)."
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1 text-xs text-slate-500">Keep private phone numbers out of the description — buyers can message you directly on CampusBazaar.</p>
              </div>

              <div className="sm:col-span-2 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="listing-image" className="mb-2 block text-sm font-semibold text-slate-800">
                    Upload item photo <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="listing-image"
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    aria-describedby="image-help image-error"
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p id="image-help" className="mt-1 text-xs text-slate-500">JPG, PNG, or WebP up to 5 MB.</p>
                </div>
                <div>
                  <label htmlFor="listing-imageUrl" className="mb-2 block text-sm font-semibold text-slate-800">
                    Or paste image URL <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="listing-imageUrl"
                    name="imageUrl"
                    type="url"
                    value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                    onChange={(event) => {
                      updateField(event);
                      setImagePreview(event.target.value || null);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className={inputClass}
                  />
                </div>
                {imageError && <p id="image-error" role="alert" className="sm:col-span-2 text-sm font-medium text-red-700">{imageError}</p>}
                {imagePreview && (
                  <div className="sm:col-span-2 flex items-center gap-4">
                    <img src={imagePreview} alt="Selected item preview" className="max-h-44 rounded-xl border border-slate-200 bg-white object-contain p-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setForm((current) => ({ ...current, imageUrl: '' }));
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-6 pt-1">
                <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="studentDeal"
                    checked={form.studentDeal}
                    onChange={updateField}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Highlight as a <strong>Student Deal</strong></span>
                </label>
                <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hostelClearance"
                    checked={form.hostelClearance}
                    onChange={updateField}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tag under <strong>Hostel Clearance</strong></span>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/" className="btn-secondary">Cancel</Link>
              <button
                type="submit"
                disabled={submitting || categoriesRequest.loading || !categoriesRequest.data}
                className="btn-primary rounded-xl px-6 py-3 font-semibold disabled:opacity-60"
              >
                {submitting ? (listingId ? 'Updating listing…' : 'Saving listing…') : (listingId ? 'Save changes' : 'Publish listing')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
