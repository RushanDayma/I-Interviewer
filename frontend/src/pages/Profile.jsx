import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { updateProfile, reset } from '../features/auth/authSlice'

const ROLES = [
  "Software Developer", "MEAN Stack Developer", "Full Stack Python", "Full Stack Java",
  "Frontend Developer", "Backend Developer", "Data Scientist", "Data Analyst",
  "Machine Learning Engineer", "DevOps Engineer", "Cloud Engineer (AWS/Azure/GCP)",
  "Cybersecurity Engineer", "Blockchain Developer", "Mobile Developer (iOS/Android)",
  "Game Developer", "UI/UX Designer", "QA Automation Engineer", "Product Manager"
];

const inputClass = 'w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, isSuccess, isError, message, isProfileLoading } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', preferredRole: user?.preferredRole || '' });

  useEffect(() => {
    if (!isError && !isSuccess) return;
    if (isError) toast.error(message);
    if (isSuccess) toast.success('Profile updated');
    dispatch(reset());
  }, [isError, isSuccess, message, dispatch]);

  useEffect(() => {
    if (user) setFormData({ name: user?.name || '', email: user?.email || '', preferredRole: user?.preferredRole || '' });
  }, [user]);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name === user.name && formData.preferredRole === user.preferredRole) {
      toast.info('No changes to save.');
      return;
    }
    dispatch(updateProfile(formData));
  }

  return (
    <div className='max-w-xl mx-auto px-4 py-8 sm:py-12'>
      <div className='bg-white border border-zinc-200 rounded-xl p-6 sm:p-8'>
        <div className='mb-6 pb-5 border-b border-zinc-100'>
          <h1 className='text-lg font-semibold text-zinc-900'>Profile</h1>
          <p className='text-sm text-zinc-500 mt-0.5'>Update your name and target role.</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <Field label="Full name">
            <input
              type="text" name="name" value={formData.name}
              className={inputClass}
              placeholder='Your name'
              onChange={handleChange}
            />
          </Field>

          <Field label="Email" muted>
            <input
              type="email"
              className='w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-400 cursor-not-allowed'
              disabled value={formData.email}
            />
          </Field>

          <Field label="Target role">
            <div className='relative'>
              <select name="preferredRole" value={formData.preferredRole} onChange={handleChange} className={`${inputClass} appearance-none`}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400'>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </Field>

          <div className='pt-2'>
            <button
              type='submit'
              disabled={isProfileLoading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isProfileLoading ? 'bg-zinc-200 text-zinc-400 cursor-wait' : 'bg-zinc-900 text-white hover:bg-zinc-700'
              }`}
            >
              {isProfileLoading
                ? <><span className='w-4 h-4 border-2 border-zinc-400 border-t-transparent animate-spin rounded-full' /> Saving...</>
                : 'Save changes'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children, muted }) {
  return (
    <div className={`space-y-1.5 ${muted ? 'opacity-50' : ''}`}>
      <label className='text-xs font-medium text-zinc-400 uppercase tracking-wider'>{label}</label>
      {children}
    </div>
  )
}

export default Profile
