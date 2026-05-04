import React, { useEffect, useState } from 'react';
import type { ElicitationDashboard, QuestionItem, ContributorItem } from '../api/client';
import { api } from '../api/client';
import { MessageSquareText, Send, User, Award, Clock } from 'lucide-react';

const ElicitationSimulator = () => {
 const [data, setData] = useState<ElicitationDashboard | null>(null);
 const [loading, setLoading] = useState(true);
 const [answerText, setAnswerText] = useState<Record<string, string>>({});

 const load = () => {
  api.getElicitation().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
 };
 useEffect(load, []);

 const handleAnswer = async (qId: string) => {
  const text = answerText[qId];
  if (!text?.trim()) return;
  await api.submitAnswer(qId, text);
  setAnswerText(prev => ({ ...prev, [qId]: '' }));
  load();
 };

 const typeColor = (t: string) => {
  if (t === 'GAP_FILL') return 'bg-blue-100 text-blue-600 border-blue-200';
  if (t === 'CONTRADICTION') return 'bg-red-100 text-red-600 border-red-200';
  if (t === 'DECAY_REVALIDATION') return 'bg-amber-100 text-amber-600 border-amber-200';
  return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
 };

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading elicitation data…</div>;
 if (!data) return <div className="p-8 text-red-600">Failed to load.</div>;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Active Elicitation Engine</h1>
     <p className="text-gray-400 mt-1">L5 — Human-in-the-Loop Knowledge Capture</p>
    </div>
    <div className="flex gap-3">
     <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
      <div className="text-xs text-gray-400 uppercase">Total Questions</div>
      <div className="text-xl font-bold text-gray-900">{data.stats.total_questions}</div>
     </div>
     <div className="bg-emerald-100 border border-emerald-100 px-4 py-2 rounded-xl">
      <div className="text-xs text-emerald-600 uppercase">Response Rate</div>
      <div className="text-xl font-bold text-emerald-600">{Math.round((data.stats.response_rate || 0) * 100)}%</div>
     </div>
    </div>
   </header>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Pending Questions */}
    <div className="lg:col-span-2 space-y-4">
     <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><MessageSquareText className="w-5 h-5 text-indigo-600" /> Pending Questions</h2>
     {data.pending_questions.length === 0 ? (
      <div className="text-gray-400 text-center py-8">All questions answered! 🎉</div>
     ) : data.pending_questions.map(q => (
      <div key={q.id} className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-5">
       <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeColor(q.question_type)}`}>{q.question_type.replace(/_/g, ' ')}</span>
        <span className={`px-2 py-0.5 rounded text-xs ${q.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>{q.priority}</span>
        <span className="text-xs text-gray-400">{q.employee_name} · {q.department}</span>
       </div>
       <p className="text-sm text-gray-800 mb-4 leading-relaxed">{q.question_text}</p>
       <div className="flex gap-3 mb-3 text-xs text-gray-400">
        <span>Specificity: {q.specificity.toFixed(2)}</span>
        <span>Groundedness: {q.groundedness.toFixed(2)}</span>
        <span>Answerability: {q.answerability.toFixed(2)}</span>
       </div>
       <div className="flex gap-2">
        <input type="text" placeholder="Type answer…" value={answerText[q.id] || ''}
         onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
         className="flex-1 bg-gray-100 border border-[#E5E5EA] rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button onClick={() => handleAnswer(q.id)}
         className="px-4 py-2 bg-indigo-500/20 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
        ><Send className="w-4 h-4" /> Submit</button>
       </div>
      </div>
     ))}

     {data.recent_answers.length > 0 && (
      <>
       <h2 className="text-lg font-semibold text-gray-900 mt-8 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600" /> Recent Answers</h2>
       {data.recent_answers.map(q => (
        <div key={q.id} className="bg-white premium-shadow border border-emerald-500/10 rounded-2xl p-4 opacity-70">
         <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-emerald-600">✓ ANSWERED</span>
          <span className="text-xs text-gray-400">{q.employee_name}</span>
         </div>
         <p className="text-sm text-gray-400">{q.question_text}</p>
        </div>
       ))}
      </>
     )}
    </div>

    {/* Contributors */}
    <div>
     <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-600" /> Top Contributors</h2>
     <div className="space-y-3">
      {data.contributors.map((c, i) => (
       <div key={c.employee_id} className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-2">
         <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-gray-900 text-sm font-bold">{i + 1}</div>
         <div>
          <div className="text-sm text-gray-900 font-medium">{c.display_name}</div>
          <div className="text-xs text-gray-400">{c.role} · {c.department}</div>
         </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
         <div><span className="text-gray-400 block">Score</span><span className="text-gray-900">{c.reputation_score.toFixed(2)}</span></div>
         <div><span className="text-gray-400 block">Contribs</span><span className="text-gray-900">{c.total_contributions}</span></div>
         <div><span className="text-gray-400 block">Rate</span><span className="text-gray-900">{Math.round(c.response_rate * 100)}%</span></div>
        </div>
        {c.badge && <span className="mt-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-600 text-xs rounded border border-amber-200">{c.badge}</span>}
       </div>
      ))}
     </div>
    </div>
   </div>
  </div>
 );
};

export default ElicitationSimulator;
