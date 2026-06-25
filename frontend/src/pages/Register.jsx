import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { register, reset } from '../features/auth/authSlice'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', password2: '' })
  const { name, email, password, password2 } = formData
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isError) { toast.error(message); dispatch(reset()) }
    if (isSuccess) { toast.success('Account created'); navigate('/'); dispatch(reset()) }
    if (user && !isSuccess) navigate('/')
  }, [user, isError, isSuccess, message, navigate, dispatch])

  const onChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
  const onSubmit = (e) => {
    e.preventDefault()
    if (password !== password2) { toast.error('Passwords do not match'); return }
    dispatch(register({ name, email, password }))
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
          <h1 className='text-2xl font-semibold text-zinc-900 tracking-tight'>Create an account</h1>
          <p className='text-sm text-zinc-500 mt-1'>Practice interviews on your own terms.</p>
        </div>

        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='space-y-1'>
            <label className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>Full name</label>
            <input
              type="text" name="name" value={name}
              className='w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all'
              placeholder='Your name'
              onChange={onChange} required
            />
          </div>
          <div className='space-y-1'>
            <label className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>Email</label>
            <input
              type="email" name="email" value={email}
              className='w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all'
              placeholder='you@example.com'
              onChange={onChange} required
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>Password</label>
              <input
                type="password" name="password" value={password}
                className='w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all'
                placeholder='••••••••'
                onChange={onChange} required
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>Confirm</label>
              <input
                type="password" name="password2" value={password2}
                className='w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all'
                placeholder='••••••••'
                onChange={onChange} required
              />
            </div>
          </div>
          <button
            type="submit"
            className='w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors mt-2'
          >
            Create account
          </button>
        </form>

        <p className='mt-6 text-center text-sm text-zinc-500'>
          Already have an account? <Link to="/login" className='text-teal-600 font-medium hover:underline'>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
