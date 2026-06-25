import { useState, useEffect } from "react"
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createSession, getSessions, reset, deleteSession } from '../features/sessions/sessionSlice'
import { toast } from 'react-toastify'
import SessionCard from "../components/SessionCard"

const ROLES = [
  "Software Developer", "MEAN Stack Developer", "Full Stack Python", "Full Stack Java",
  "Frontend Developer", "Backend Developer", "Data Scientist", "Data Analyst",
  "Machine Learning Engineer", "DevOps Engineer", "Cloud Engineer (AWS/Azure/GCP)",
  "Cybersecurity Engineer", "Blockchain Developer", "Mobile Developer (iOS/Android)",
  "Game Developer", "UI/UX Designer", "QA Automation Engineer", "Product Manager"
];
const LEVELS = ["Junior", "Mid-Level", "Senior"];
const TYPES = [{ label: 'Oral only', value: 'oral-only' }, { label: 'Coding + Oral', value: 'coding+oral' }];
const COUNTS = [5, 10, 15];

const selectClass = "w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { sessions, isLoading, isGenerating, isError, message } = useSelector((state) => state.sessions);
  const isProcessing = isGenerating;

  const [formData, setFormData] = useState({
    role: user.preferredRole || ROLES[0],
    level: LEVELS[0],
    interviewType: TYPES[1].value,
    count: COUNTS[0],
  });

  useEffect(() => { dispatch(getSessions()); }, [dispatch]);

  useEffect(() => {
    if (isError && message) { toast.error(message); dispatch(reset()); }
  }, [isError, message, dispatch]);

  const onChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = (e) => { e.preventDefault(); dispatch(createSession(formData)); }

  const viewSession = (session) => {
    if (session.status === 'completed') navigate(`/review/${session._id}`);
    else if (session.status === 'in-progress') navigate(`/interview/${session._id}`);
    else toast.info('Session not ready yet');
  }

  const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Delete this session?')) {
      dispatch(deleteSession(sessionId));
      toast.error('Session deleted');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Hey, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">What are we working on today?</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-center min-w-[100px]">
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Sessions</p>
          <p className="text-2xl font-semibold text-zinc-900 leading-none mt-0.5">{sessions.length}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800">Set up your interview</h2>
          <span className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
            Ready
          </span>
        </div>
        <form onSubmit={onSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</label>
            <div className="relative">
              <select name="role" value={formData.role} onChange={onChange} className={selectClass}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:contents">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Level</label>
              <div className="relative">
                <select name="level" value={formData.level} onChange={onChange} className={selectClass}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Length</label>
              <div className="relative">
                <select name="count" value={formData.count} onChange={onChange} className={selectClass}>
                  {COUNTS.map((c) => <option key={c} value={c}>{c} questions</option>)}
                </select>
                <ChevronDown />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Format</label>
            <div className="relative">
              <select name="interviewType" value={formData.interviewType} onChange={onChange} className={selectClass}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown />
            </div>
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className={`h-[42px] rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors ${
              isProcessing ? 'bg-zinc-300 cursor-wait' : 'bg-zinc-900 hover:bg-zinc-700'
            }`}
          >
            {isProcessing
              ? <><span className="animate-spin h-3.5 w-3.5 border-2 border-white/50 border-t-white rounded-full"></span> Generating...</>
              : 'Start interview'
            }
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-800 px-1">Past sessions</h2>
        {isLoading && sessions.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-zinc-200 border-t-zinc-600 rounded-full"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="border-2 border-dashed border-zinc-200 rounded-xl py-14 text-center">
            <p className="text-sm text-zinc-400">No sessions yet. Start one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard key={session._id} session={session} onClick={viewSession} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function ChevronDown() {
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export default Dashboard
