import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
     <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl shadow-indigo-900/5 max-w-2xl mx-auto mt-10 border border-slate-100">
      <h1 className="text-9xl font-black text-indigo-50">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mt-4 uppercase tracking-tighter">Page Not Found</h2>
      <p className="text-slate-500 mt-2 mb-8">The interview module you're looking for doesn't exist.</p>
      <Link to="/" className="inline-block bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-xs sm:text-sm">
        Back to Dashboard
      </Link>
    </div>
  )
}

export default NotFound