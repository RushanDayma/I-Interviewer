import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { login, googleLogin, reset } from '../features/auth/authSlice'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { GoogleLogin } from '@react-oauth/google'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const { email, password } = formData
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isError) { toast.error(message); dispatch(reset()) }
    if (isSuccess || user) { navigate('/'); dispatch(reset()) }
  }, [user, isError, isSuccess, message, navigate, dispatch])

  const onChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
  const onSubmit = (e) => { e.preventDefault(); dispatch(login({ email, password })) }
  const handleGoogleSuccess = (r) => {
    if (r.credential) dispatch(googleLogin(r.credential))
    else toast.error('Something went wrong.')
  }

  if (isLoading) return (
    <div className='flex justify-center items-center h-[80vh]'>
      <div className='animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-900'></div>
    </div>
  )

  return (
    <div className='flex justify-center items-center min-h-[88vh] px-4 py-12'>
      <div className='w-full max-w-sm'>
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold text-zinc-900 tracking-tight'>Welcome back</h1>
          <p className='text-sm text-zinc-500 mt-1'>Pick up where you left off.</p>
        </div>

        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='space-y-1'>
            <label className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>Email</label>
            <input
              type="email" name="email" value={email}
              className='w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all'
              placeholder='you@example.com'
              onChange={onChange} required
            />
          </div>
          <div className='space-y-1'>
            <label className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>Password</label>
            <input
              type="password" name="password" value={password}
              className='w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all'
              placeholder='••••••••'
              onChange={onChange} required
            />
          </div>
          <button
            type="submit"
            className='w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors mt-2'
          >
            Sign in
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-200"></div>
          <span className="text-xs text-zinc-400">or</span>
          <div className="flex-1 h-px bg-zinc-200"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google login failed')}
            theme="outline" size="large" width="100%" text="continue_with" shape="rectangular"
          />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account? <Link to="/register" className="text-teal-600 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
