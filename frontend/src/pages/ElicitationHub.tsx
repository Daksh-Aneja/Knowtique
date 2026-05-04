import React, { useEffect, useState } from 'react';
import type { ElicitationDashboard } from '../api/client';
import { api } from '../api/client';
import { MessagesSquare, Send, Award, CheckCircle, Clock, User, TrendingUp } from 'lucide-react';

export default function ElicitationHub() {
  const [data, setData] = useState<ElicitationDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getElicitation().then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (qId: string) => {
    if (!answerText.trim()) return;
    try {
      await api.submitAnswer(qId, answerText);
      setAnswering(null);
      setAnswerText('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const typeStyle = (t: string) => {
    if (t === 'GAP_FILL') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (t === 'CONTRADICTION') return 'bg-red-100 text-red-700 border-red-200';
    if (t === 'DECAY_REVALIDATION') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-purple-100 text-purple-700 border-purple-200';
  };

  if (loading && !data) return <div className="p-8 text-gray-400 animate-pulse">Loading Knowledge Capture…</div>;
  if (!data) return <div className="p-8 text-red-600">Failed to load elicitation data.</div>;
  const d = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <MessagesSquare className="w-8 h-8 text-blue-600" />
            Knowledge Capture Hub
          </h1>
          <p className="text-gray-500 mt-2">Active Elicitation — Targeted micro-surveys for domain expert knowledge harvesting</p>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white premium-shadow border border-[#E5E5EA] p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg"><MessagesSquare className="w-5 h-5 text-blue-600" /></div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Questions Sent (7d)</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-gray-900">{d.stats.total_questions}</div>
        </div>
        <div className="bg-white premium-shadow border border-[#E5E5EA] p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Response Rate</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-emerald-600">{(d.stats.response_rate * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white premium-shadow border border-[#E5E5EA] p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Award className="w-5 h-5 text-amber-600" /></div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg Quality Score</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-gray-900">{(d.stats.avg_quality_score * 100).toFixed(0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Questions — 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Pending Questions ({d.pending_questions.length})</h2>

          {d.pending_questions.length === 0 ? (
            <div className="bg-white premium-shadow border border-gray-100 rounded-2xl p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">All Caught Up</h3>
              <p className="text-gray-500 text-sm mt-1">No pending knowledge gaps to resolve.</p>
            </div>
          ) : (
            d.pending_questions.map((q) => (
              <div key={q.id} className="bg-white premium-shadow border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${typeStyle(q.question_type)}`}>
                    {q.question_type.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    q.priority === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>{q.priority}</span>
                  <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                    <User className="w-3 h-3" /> {q.employee_name} · {q.department}
                  </span>
                </div>

                <p className="text-sm text-gray-800 leading-relaxed mb-3">{q.question_text}</p>

                <div className="flex gap-4 mb-3 text-xs text-gray-400">
                  <span>Specificity: <strong className="text-gray-600">{q.specificity.toFixed(2)}</strong></span>
                  <span>Groundedness: <strong className="text-gray-600">{q.groundedness.toFixed(2)}</strong></span>
                  <span>Answerability: <strong className="text-gray-600">{q.answerability.toFixed(2)}</strong></span>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  Context: <span className="text-indigo-600 font-medium">{q.context_ref}</span> · via {q.delivery_channel}
                </div>

                {answering === q.id ? (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your answer to resolve this knowledge gap..."
                      className="w-full h-20 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setAnswering(null); setAnswerText(''); }}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                      >Cancel</button>
                      <button
                        onClick={() => handleSubmit(q.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                      ><Send className="w-4 h-4" /> Submit Answer</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAnswering(q.id)}
                    className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                  >Answer This Question</button>
                )}
              </div>
            ))
          )}

          {/* Recent Answers */}
          {d.recent_answers.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mt-8 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" /> Recently Harvested
              </h2>
              {d.recent_answers.map(q => (
                <div key={q.id} className="bg-white premium-shadow border border-emerald-100 rounded-2xl p-4 opacity-70">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-semibold">ANSWERED</span>
                    <span className="text-xs text-gray-400 ml-auto">{q.employee_name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{q.question_text}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Top Contributors — 1 col */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" /> Top Contributors
          </h2>
          <div className="space-y-3">
            {d.contributors.map((c, i) => (
              <div key={c.employee_id} className="bg-white premium-shadow border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-600'
                  }`}>{i + 1}</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{c.display_name}</div>
                    <div className="text-xs text-gray-400">{c.role} · {c.department}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-400 block">Score</span><span className="font-bold text-emerald-600">{c.reputation_score.toFixed(2)}</span></div>
                  <div><span className="text-gray-400 block">Contribs</span><span className="font-bold text-gray-900">{c.total_contributions}</span></div>
                  <div><span className="text-gray-400 block">Rate</span><span className="font-bold text-gray-900">{Math.round(c.response_rate * 100)}%</span></div>
                </div>
                {c.badge && (
                  <span className="mt-2 inline-block px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded border border-amber-200">{c.badge}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
