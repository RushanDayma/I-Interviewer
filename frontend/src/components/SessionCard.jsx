const SessionCard = ({ session, onClick, onDelete }) => {
  const isDeletable = session.status !== 'pending';

  const statusConfig = {
    completed: { label: 'Completed', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'in-progress': { label: 'In progress', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    pending: { label: 'Pending', classes: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
  };
  const status = statusConfig[session.status] || statusConfig.pending;

  const scoreColor =
    session.status !== 'completed' ? 'text-zinc-300' :
    session.overallScore > 75 ? 'text-emerald-600' : 'text-amber-500';

  return (
    <div
      onClick={() => onClick(session)}
      className='group bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer'
    >
      <div className='flex items-center gap-3 flex-1 min-w-0'>
        <div className='w-9 h-9 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center'>
          <RoleIcon role={session.role} />
        </div>
        <div className='min-w-0'>
          <p className='text-sm font-medium text-zinc-900 truncate'>{session.role}</p>
          <div className='flex items-center gap-2 mt-0.5'>
            <span className='text-xs text-zinc-400'>{new Date(session.createdAt).toLocaleDateString()}</span>
            <span className='text-zinc-300'>·</span>
            <span className='text-xs text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded'>{session.level}</span>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between sm:justify-end gap-6 sm:gap-5 border-t sm:border-t-0 border-zinc-100 pt-3 sm:pt-0'>
        <div className='text-left sm:text-right'>
          <p className='text-xs text-zinc-400'>Score</p>
          <p className={`text-lg font-semibold ${scoreColor}`}>
            {session.status === 'completed' ? session.overallScore : '--'}
          </p>
        </div>

        <div className='flex flex-col items-end gap-1.5'>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.classes}`}>
            {status.label}
          </span>
          <span className='text-xs text-teal-600 font-medium flex items-center gap-1'>
            {session.status === 'completed' ? 'View results' : 'Resume'}
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (isDeletable) onDelete(e, session._id); }}
          className={`p-2 rounded-lg transition-colors ${isDeletable ? 'text-zinc-300 hover:text-red-500 hover:bg-red-50' : 'text-zinc-200 cursor-not-allowed'}`}
          title='Delete session'
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function RoleIcon({ role }) {
  const r = role || '';
  const cls = "w-4 h-4 text-zinc-500";

  if (r.includes('Python') || r.includes('Data') || r.includes('Machine')) {
    return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>;
  }
  if (r.includes('DevOps') || r.includes('Cloud')) {
    return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
  }
  if (r.includes('Security') || r.includes('Cyber')) {
    return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
  }
  if (r.includes('Mobile') || r.includes('iOS') || r.includes('Android')) {
    return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
  }
  if (r.includes('UI') || r.includes('UX') || r.includes('Designer')) {
    return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  }
  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
}

export default SessionCard
