import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { getSessionById } from '../features/sessions/sessionSlice';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatDuration = (start, end) => {
  if (!start || !end) return 'N/A';
  const diff = new Date(end) - new Date(start);
  const seconds = Math.floor(diff / 1000);
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const sanitizeQuestionText = (text) => text ? text.replace(/^\d+[\s.)]+/, '').trim() : "";

const formatIdealAnswer = (text) => {
  try {
    if (!text) return "Pending evaluation.";
    let clean = text.trim();
    if (clean.startsWith('```')) clean = clean.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      const parsed = JSON.parse(clean);
      if (parsed.verbalAnswer || parsed.idealAnswer || parsed.idealanswer) return parsed.verbalAnswer || parsed.idealAnswer || parsed.idealanswer;
      const explanation = parsed.explanation || parsed.understanding || "";
      const code = parsed.code || parsed.codeExample || parsed.example || "";
      if (explanation || code) return `${explanation}\n\n${code}`.trim();
    }
    return text;
  } catch { return text; }
};

function SessionReview() {
  const { sessionId } = useParams();
  const dispatch = useDispatch();
  const { activeSession, isLoading } = useSelector(state => state.sessions);

  useEffect(() => { dispatch(getSessionById(sessionId)); }, [dispatch, sessionId]);

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin h-7 w-7 border-2 border-zinc-300 border-t-zinc-700 rounded-full"></div>
    </div>
  );

  if (!activeSession || activeSession.status !== 'completed') {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-white border border-zinc-200 rounded-xl text-center">
        <h2 className="text-base font-semibold text-zinc-900 mb-2">Not ready yet</h2>
        <p className="text-sm text-zinc-500 mb-6">Still processing. Check back in a moment.</p>
        <Link to="/" className="inline-block bg-zinc-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { overallScore, matrix, metrics, role, level, question, startTime, endTime } = activeSession;
  const questions = question || [];
  const finalMetrics = matrix || metrics || {};

  const barData = {
    labels: questions.map((_, i) => `Q${i + 1}`),
    datasets: [{
      label: 'Technical Score',
      data: questions.map(q => q.technicalScore || 0),
      backgroundColor: questions.map(q => (q.technicalScore || 0) > 70 ? '#0d9488' : '#94a3b8'),
      borderRadius: 6,
    }],
  };

  const stats = [
    { label: 'Overall', value: `${overallScore || 0}%`, highlight: true },
    { label: 'Technical', value: `${finalMetrics?.avgTechnical ?? finalMetrics?.avgTechnicalScore ?? 0}%` },
    { label: 'Confidence', value: `${finalMetrics?.avgConfidence ?? finalMetrics?.avgConfidenceScore ?? 0}%` },
    { label: 'Duration', value: formatDuration(startTime, endTime) },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <div className="pb-5 border-b border-zinc-200">
        <p className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-1">Session complete</p>
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900">{role} <span className="text-zinc-400 font-normal">({level})</span></h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className={`bg-white border rounded-xl p-4 ${s.highlight ? 'border-teal-500 border-l-4' : 'border-zinc-200'}`}>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.highlight ? 'text-teal-600' : 'text-zinc-800'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Score per question</p>
        <div className="h-52">
          <Bar
            data={barData}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, max: 100, grid: { color: '#f4f4f5' }, ticks: { color: '#a1a1aa', font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 11 } } }
              }
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-800 px-1">Question breakdown</h2>
        {questions.map((q, index) => (
          <div key={index} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <h3 className="text-sm font-medium text-zinc-800 flex-1 leading-snug">
                  <span className="text-teal-600 font-semibold mr-1.5">Q{index + 1}.</span>
                  {sanitizeQuestionText(q.questionText)}
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Tech {q.technicalScore || 0}%
                  </span>
                  <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                    Conf {q.confidenceScore || 0}%
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Your submission</p>
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg overflow-hidden">
                  {q.userSubmittedCode && q.userSubmittedCode !== "undefined" && (
                    <div className="p-4 border-b border-zinc-100 last:border-0">
                      <p className="text-xs text-zinc-400 font-medium mb-1.5">Code</p>
                      <pre className="text-xs font-mono text-zinc-700 whitespace-pre-wrap overflow-x-auto">{q.userSubmittedCode}</pre>
                    </div>
                  )}
                  {q.userAnswerText && (
                    <div className="p-4">
                      <p className="text-xs text-zinc-400 font-medium mb-1.5">Transcript</p>
                      <p className="text-sm text-zinc-600 italic leading-relaxed">"{q.userAnswerText}"</p>
                    </div>
                  )}
                  {(!q.userSubmittedCode || q.userSubmittedCode === "undefined") && !q.userAnswerText && (
                    <p className="p-4 text-center text-xs text-zinc-400 italic">No answer recorded.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Feedback</p>
                  <div className="bg-zinc-50 border-l-2 border-teal-500 p-4 rounded-r-lg text-sm text-zinc-600 leading-relaxed italic">
                    "{q.aiFeedback}"
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Model answer</p>
                  <pre className="bg-zinc-900 text-zinc-300 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {formatIdealAnswer(q.idealAnswer)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-4">
        <Link to="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default SessionReview;
