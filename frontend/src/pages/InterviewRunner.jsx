import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById, submitAnswer, endSession } from '../features/sessions/sessionSlice';
import MonacoEditor from '@monaco-editor/react';
import { toast } from 'react-toastify';
import { io } from "socket.io-client";

const SUPPORTED_LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' }, { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' }, { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' }, { label: 'C#', value: 'csharp' },
  { label: 'Go', value: 'go' }, { label: 'Swift', value: 'swift' },
  { label: 'Kotlin', value: 'kotlin' }, { label: 'R Language', value: 'r' },
  { label: 'SQL', value: 'sql' }, { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' }, { label: 'Solidity', value: 'solidity' },
  { label: 'Shell', value: 'shell' }, { label: 'YAML', value: 'yaml' },
  { label: 'Markdown', value: 'markdown' }, { label: 'Plain Text', value: 'plaintext' },
];

const ROLE_LANGUAGE_MAP = {
  "Software Developer": "python", "MEAN Stack Developer": "typescript",
  "Full Stack Python": "python", "Full Stack Java": "java",
  "Frontend Developer": "javascript", "Backend Developer": "javascript",
  "Data Scientist": "python", "Data Analyst": "python",
  "Machine Learning Engineer": "python", "DevOps Engineer": "shell",
  "Cloud Engineer (AWS/Azure/GCP)": "yaml", "Cybersecurity Engineer": "python",
  "Blockchain Developer": "solidity", "Mobile Developer (iOS/Android)": "swift",
  "Game Developer": "csharp", "QA Automation Engineer": "python",
  "UI/UX Designer": "css", "Product Manager": "markdown"
};

function InterviewRunner() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeSession = useSelector(state => state.sessions.activeSession);
  const { isLoading, message } = useSelector(state => state.sessions);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000");
    return () => socketRef.current.close();
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on("sessionUpdate", (data) => {
      if (data.status === "evaluation_completed") {
        toast.success("Feedback ready");
        dispatch(getSessionById(sessionId));
      }
    });
    return () => socketRef.current.off("sessionUpdate");
  }, [sessionId, dispatch]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState();
  const detectedLanguage = activeSession?.role ? ROLE_LANGUAGE_MAP[activeSession.role] || 'plaintext' : 'javascript';
  const effectiveLanguage = selectedLanguage || detectedLanguage;
  const [submittedLocal, setSubmittedLocal] = useState({});
  const [drafts, setDrafts] = useState(() => {
    const saved = localStorage.getItem(`drafts_${sessionId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => { localStorage.setItem(`drafts_${sessionId}`, JSON.stringify(drafts)); }, [drafts, sessionId]);
  useEffect(() => { dispatch(getSessionById(sessionId)); }, [dispatch, sessionId]);

  const currentQuestion = activeSession?.question?.[currentQuestionIndex];
  const isReduxSubmitted = currentQuestion?.isSubmitted === true;
  const isLocallySubmitted = submittedLocal[currentQuestionIndex] === true;
  const isQuestionLocked = isReduxSubmitted || isLocallySubmitted;
  const isProcessing = isQuestionLocked && !currentQuestion?.isEvaluated;

  const handleNavigation = (index) => {
    if (index >= 0 && index < (activeSession?.question?.length || 0)) {
      if (isRecording) stopRecording();
      setCurrentQuestionIndex(index);
      setRecordingTime(0);
    }
  };

  const updateDraftCode = (newCode) => {
    if (isQuestionLocked) return;
    setDrafts(prev => ({ ...prev, [currentQuestionIndex]: { ...prev[currentQuestionIndex], code: newCode } }));
  };

  const startRecording = async () => {
    if (isQuestionLocked) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setDrafts(prev => ({ ...prev, [currentQuestionIndex]: { ...prev[currentQuestionIndex], audioBlob: blob } }));
      };
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch { toast.error("Microphone access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(timerIntervalRef.current);
      setIsRecording(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (isQuestionLocked) return;
    if (isRecording) stopRecording();
    const draft = drafts[currentQuestionIndex];
    const code = draft?.code || '';
    const audio = draft?.audioBlob;
    if (!code && !audio) { toast.warning("Add code or a verbal answer first."); return; }
    setSubmittedLocal(prev => ({ ...prev, [currentQuestionIndex]: true }));
    const formData = new FormData();
    formData.append('questionIndex', currentQuestionIndex);
    if (code) formData.append('code', code);
    if (audio && audio instanceof Blob) formData.append('audioFile', audio, 'answer.webm');
    dispatch(submitAnswer({ sessionId, formData }))
      .unwrap()
      .catch(() => { setSubmittedLocal(prev => ({ ...prev, [currentQuestionIndex]: false })); toast.error("Submission failed. Try again."); });
  };

  const handleFinishInterview = () => {
    if (!window.confirm("Finish this interview?")) return;
    dispatch(endSession(sessionId))
      .unwrap()
      .then(() => { localStorage.removeItem(`drafts_${sessionId}`); navigate(`/review/${sessionId}`); })
      .catch(() => toast.error("Couldn't finish. The AI is still working."));
  };

  if (!activeSession) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin h-7 w-7 border-2 border-zinc-300 border-t-zinc-700 rounded-full"></div>
    </div>
  );

  const currentDraft = drafts[currentQuestionIndex] || {};
  const totalQuestions = activeSession?.question?.length || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">

      <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{activeSession.role}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {activeSession?.question?.map((q, i) => (
              <button
                key={i}
                onClick={() => handleNavigation(i)}
                className={`rounded-full transition-all ${
                  i === currentQuestionIndex ? 'w-5 h-2.5 bg-zinc-900' :
                  q.isEvaluated ? 'w-2.5 h-2.5 bg-emerald-500' :
                  (q.isSubmitted || submittedLocal[i]) ? 'w-2.5 h-2.5 bg-amber-400' :
                  'w-2.5 h-2.5 bg-zinc-200 hover:bg-zinc-300'
                }`}
                title={`Question ${i + 1}`}
              />
            ))}
            <span className="ml-2 text-xs text-zinc-400">{currentQuestionIndex + 1} / {totalQuestions}</span>
          </div>
        </div>
        <button
          onClick={handleFinishInterview}
          disabled={isLoading}
          className="text-sm font-medium text-red-600 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          {isLoading ? "Finishing..." : "End interview"}
        </button>
      </div>

      <div className="bg-zinc-900 text-white p-6 sm:p-8 rounded-xl mb-5 border-l-4 border-teal-500">
        <p className="text-teal-400 text-xs font-medium uppercase tracking-wider mb-3">Question {currentQuestionIndex + 1}</p>
        <h2 className="text-lg sm:text-xl font-medium leading-relaxed">{currentQuestion?.questionText}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center min-h-[260px]">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-6">Verbal answer</p>

          {!isRecording && !currentDraft.audioBlob ? (
            <button
              onClick={startRecording}
              disabled={isQuestionLocked}
              className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-white hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          ) : isRecording ? (
            <div className="text-center">
              <button
                onClick={stopRecording}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors animate-pulse"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
              <p className="mt-3 text-sm font-mono text-red-500">{recordingTime}s</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium text-sm mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Audio captured
              </div>
              {!isQuestionLocked && (
                <button
                  onClick={() => setDrafts(prev => ({ ...prev, [currentQuestionIndex]: { ...prev[currentQuestionIndex], audioBlob: null } }))}
                  className="text-xs text-zinc-400 hover:text-red-500 underline transition-colors"
                >
                  Delete and re-record
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden h-[300px] flex flex-col">
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Code</span>
            <select
              value={effectiveLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isQuestionLocked}
              className="text-xs bg-white border border-zinc-200 rounded-md px-2 py-1 text-zinc-700 outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-zinc-50 disabled:text-zinc-400 transition-all"
            >
              {SUPPORTED_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={effectiveLanguage}
              theme="vs-dark"
              value={currentDraft.code || ''}
              onChange={updateDraftCode}
              options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, readOnly: isQuestionLocked, domReadOnly: isQuestionLocked }}
            />
          </div>
        </div>
      </div>

      {currentQuestion?.isEvaluated && currentQuestion?.aiFeedback && currentQuestion?.aiFeedback !== "Not evaluated yet" && (
        <div className="mt-4 bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Feedback</p>
            <span className="text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-md">{currentQuestion.technicalScore}/100</span>
          </div>
          <p className="text-sm text-emerald-800 leading-relaxed">{currentQuestion.aiFeedback}</p>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-zinc-200 px-4 py-3 flex justify-between items-center z-50">
        <button
          onClick={() => handleNavigation(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-25 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Prev
        </button>

        <div className="flex flex-col items-center gap-1.5">
          {isProcessing && message && (
            <p className="text-xs text-zinc-400 font-mono animate-pulse">{message}...</p>
          )}
          <button
            onClick={handleSubmitAnswer}
            disabled={isQuestionLocked}
            className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              isProcessing ? 'bg-zinc-300 cursor-wait' :
              currentQuestion?.isEvaluated ? 'bg-emerald-500 cursor-default' :
              isQuestionLocked ? 'bg-zinc-300' :
              'bg-zinc-900 hover:bg-zinc-700'
            }`}
          >
            {isProcessing ? "Analyzing..." : currentQuestion?.isEvaluated ? "Evaluated" : isQuestionLocked ? "Submitted" : "Submit answer"}
          </button>
        </div>

        <button
          onClick={() => handleNavigation(currentQuestionIndex + 1)}
          disabled={currentQuestionIndex === totalQuestions - 1}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-25 transition-colors flex items-center gap-1"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

export default InterviewRunner;
