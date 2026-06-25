import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { logout, reset } from "../features/auth/authSlice"

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate("/login");
  }

  const isActive = (path) => location.pathname === path;

  const navLink = (path, label) => (
    <Link
      to={path}
      className={`text-sm font-medium transition-colors pb-0.5 ${
        isActive(path)
          ? 'text-zinc-900 border-b-2 border-teal-600'
          : 'text-zinc-500 hover:text-zinc-900 border-b-2 border-transparent'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center group-hover:bg-teal-600 transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">I-Interviewer</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {navLink('/', 'Dashboard')}
              {navLink('/profile', 'Profile')}
              <span className="text-zinc-300">|</span>
              <span className="text-xs text-zinc-500 font-medium">{user.name.split(' ')[0]}</span>
              <button
                onClick={onLogout}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              {navLink('/login', 'Sign in')}
              <Link to="/register" className="text-sm font-medium bg-zinc-900 text-white px-3.5 py-1.5 rounded-md hover:bg-zinc-700 transition-colors">
                Get started
              </Link>
            </>
          )}
        </nav>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-zinc-100">
          <div className="px-4 py-4 space-y-1">
            {user ? (
              <>
                <div className="px-3 py-2 mb-2">
                  <p className="text-xs text-zinc-400">Signed in as</p>
                  <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                </div>
                <Link to="/" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'}`}>Dashboard</Link>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/profile') ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'}`}>Profile</Link>
                <button onClick={onLogout} className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50">Sign in</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
