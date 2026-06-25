import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <p className="text-8xl font-semibold text-zinc-100 select-none">404</p>
      <h2 className="text-lg font-semibold text-zinc-800 mt-2">Page not found</h2>
      <p className="text-sm text-zinc-500 mt-1 mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="text-sm font-medium bg-zinc-900 text-white px-5 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
        Back to dashboard
      </Link>
    </div>
  )
}

export default NotFound
