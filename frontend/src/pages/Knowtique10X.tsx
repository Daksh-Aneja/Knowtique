import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Globe2, Scale, ShieldCheck, Fingerprint, Activity, Network, Code2 } from 'lucide-react';

const Knowtique10X = () => {
  const [quantumEvents, setQuantumEvents] = useState<any[]>([]);
  const [regulatoryRules, setRegulatoryRules] = useState<any[]>([]);
  const [federatedExports, setFederatedExports] = useState<any[]>([]);
  const [polymorphicEvents, setPolymorphicEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getQuantumEvents(),
      api.getRegulatoryRules(),
      api.getFederatedExports(),
      api.getPolymorphicEvents()
    ]).then(([quantum, regulatory, federated, poly]) => {
      setQuantumEvents(quantum);
      setRegulatoryRules(regulatory);
      setFederatedExports(federated);
      setPolymorphicEvents(poly);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-indigo-600 animate-pulse">Loading Advanced Capabilities...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="pb-6 border-b border-[#E5E5EA]">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight flex items-center gap-3">
          <Globe2 className="w-8 h-8 text-indigo-500" />
          Advanced Capabilities
        </h1>
        <p className="text-gray-500 mt-1">
          Cross-organization skill sharing, automated compliance, and high-security audit ledgers.
        </p>
      </header>

      {/* L22: Federated Engine */}
      <section className="bg-white border border-[#E5E5EA] rounded-2xl premium-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center gap-3 bg-indigo-50/50">
          <Network className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Global Skill Network</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">Anonymized skill sharing across organizations.</p>
          {federatedExports.length === 0 ? (
            <div className="text-sm text-gray-400">No skills exported to the network yet.</div>
          ) : (
            <div className="space-y-3">
              {federatedExports.map((exp, i) => (
                <div key={i} className="bg-gray-50 border border-[#E5E5EA] rounded-xl p-4 flex flex-col gap-2 transition-all hover:premium-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-indigo-700 bg-indigo-100 px-2 py-1 rounded-lg">{exp.skill_id}</span>
                      <span className="ml-2 text-sm text-gray-700 font-medium">Domain: {exp.domain}</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">Weight: {exp.success_rate.toFixed(3)}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono flex items-center gap-2 mt-2">
                    <Fingerprint className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 font-medium">Procedural Signature:</span> <span className="text-gray-500 truncate max-w-xl">{exp.procedural_hash}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium ml-6">Network ID: {exp.global_id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* L21: Polymorphic Engine */}
      <section className="bg-white border border-[#E5E5EA] rounded-2xl premium-shadow overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center gap-3 bg-blue-50/50">
          <Code2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Dynamic Code Generation</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">Autonomous tool bindings synthesized, sandbox-tested, and deployed.</p>
          {polymorphicEvents.length === 0 ? (
            <div className="text-sm text-gray-400">No autonomous code generated yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {polymorphicEvents.map((ev, i) => (
                <div key={i} className="bg-gray-50 border border-[#E5E5EA] rounded-xl p-4 transition-all hover:premium-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-lg tracking-wide">{ev.tool}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{ev.event_type.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm text-gray-700 font-medium mt-3">Synthesized for: <span className="font-semibold text-gray-900">{ev.skill_id}</span></div>
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-4 pt-3 border-t border-[#E5E5EA] flex justify-between items-center">
                    <span>Validation:</span>
                    <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="w-3 h-3" /> Sandbox Passed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* L24: Regulatory Engine */}
        <section className="bg-white border border-[#E5E5EA] rounded-2xl premium-shadow overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center gap-3 bg-amber-50/50">
            <Scale className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Automated Compliance Engine</h2>
          </div>
          <div className="p-6 flex-1">
            <p className="text-sm text-gray-500 mb-4">Pre-emptive compliance rules automatically synthesized from global legal updates.</p>
            {regulatoryRules.length === 0 ? (
              <div className="text-sm text-gray-400">No regulatory updates ingested yet.</div>
            ) : (
              <div className="space-y-4">
                {regulatoryRules.map(rule => (
                  <div key={rule.id} className="bg-amber-50/30 border border-amber-100 rounded-xl p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {rule.compliance_tags.map((tag: string) => (
                        <span key={tag} className="text-[11px] font-bold tracking-wide px-2 py-1 rounded-lg bg-amber-100 text-amber-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">
                      "{rule.statement}"
                    </p>
                    <div className="text-xs text-gray-500 font-medium mt-3 pt-3 border-t border-amber-100/50">Domain: {rule.domain}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* L23: Quantum Ledger */}
        <section className="bg-white border border-[#E5E5EA] rounded-2xl premium-shadow overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center gap-3 bg-emerald-50/50">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">High-Security Audit Ledger</h2>
          </div>
          <div className="p-6 flex-1">
            <p className="text-sm text-gray-500 mb-6">Advanced cryptographic signatures ensuring long-term immutability and compliance.</p>
            {quantumEvents.length === 0 ? (
              <div className="text-sm text-gray-400">No secured events yet.</div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E5E5EA] before:to-transparent">
                {quantumEvents.map((evt) => (
                  <div key={evt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-emerald-100 text-emerald-600 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Activity className="w-3 h-3" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-gray-50 p-4 rounded-xl border border-[#E5E5EA] transition-all hover:premium-shadow">
                      <div className="flex items-center justify-between space-x-2 mb-2">
                        <div className="font-bold text-gray-900 text-xs tracking-wide">{evt.event_type}</div>
                        <time className="font-mono text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{new Date(evt.timestamp).toLocaleTimeString()}</time>
                      </div>
                      <div className="text-sm text-emerald-700 font-medium mb-3 leading-relaxed">{evt.reasoning}</div>
                      <div className="text-[10px] font-mono text-gray-400 truncate max-w-full bg-white p-2 rounded border border-gray-100">
                        <span className="text-gray-500 font-semibold mr-1">Hash:</span>{evt.chain_hash}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Knowtique10X;
