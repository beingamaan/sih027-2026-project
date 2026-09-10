import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Zap,
  Wrench,
  Radio,
  FileCheck2
} from 'lucide-react';
import { releaseJointHandback } from '../../services/railwayApi';

interface HandbackInterlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHandbackSuccess?: () => void;
}

export const HandbackInterlockModal: React.FC<HandbackInterlockModalProps> = ({
  isOpen,
  onClose,
  onHandbackSuccess
}) => {
  const [engSigned, setEngSigned] = useState<boolean>(true);
  const [trdSigned, setTrdSigned] = useState<boolean>(false);
  const [sntSigned, setSntSigned] = useState<boolean>(true);
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const allSigned = engSigned && trdSigned && sntSigned;

  const handleReleasePossession = async () => {
    if (!allSigned || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await releaseJointHandback({
        block_code: 'BLK-2026-DLI-04',
        section: 'GZB - ANVR (KM 100.000 – KM 120.000) · 58km Delhi Corridor',
        departments: {
          ENG: { signed: engSigned, certified_at: new Date().toISOString() },
          TRD: { signed: trdSigned, certified_at: new Date().toISOString() },
          SNT: { signed: sntSigned, certified_at: new Date().toISOString() }
        },
        reason_code: 'JOINT_HANDBACK_GSR_4_14'
      });

      // Update local storage and dispatch global event
      localStorage.setItem('sih_joint_interlock_cleared', 'true');
      window.dispatchEvent(new CustomEvent('interlock-status-changed', { 
        detail: { pending: 0, cleared: true } 
      }));

      // Add to audit feed if possible
      try {
        const auditEvents = JSON.parse(localStorage.getItem('sih_audit_feed') || '[]');
        auditEvents.unshift({
          id: `AUDIT-HB-${Date.now()}`,
          timestamp: new Date().toISOString(),
          event: 'JOINT_HANDBACK_COMPLETED',
          title: 'G&SR 4.14 Joint Handback Executed',
          details: 'Possession released for GZB–ANVR (KM 100–120). Line Clear restored under Section Controller authority.',
          actor: 'Section Controller (IR-SEC-4091)',
          status: 'SUCCESS'
        });
        localStorage.setItem('sih_audit_feed', JSON.stringify(auditEvents.slice(0, 50)));
      } catch (err) {
        console.warn('Could not record to local audit feed', err);
      }

      setSuccessMsg(res.message || 'Joint Handback authorized under G&SR Rule 4.14. Line Clear sanctioned!');
      onHandbackSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Handback failed', err);
      setErrorMsg(
        err?.response?.data?.detail || 
        'Failed to sanction joint handback. Please verify all departmental certifications.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-[#FCFBF8] w-full max-w-2xl rounded-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#102A43] to-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  G&amp;SR RULE 4.14 INTERLOCK
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  REF: BLK-2026-DLI-04
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-black tracking-tight text-white">
                Joint Track Handback &amp; Interlock Safety Barrier (G&amp;SR Rule 4.14)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">
                GZB - ANVR (KM 100.000 – KM 120.000) · 58km Delhi Corridor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Statutory Protocol Alert */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-950 flex items-start gap-3 text-xs leading-relaxed">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase tracking-wide text-amber-900 block mb-0.5 text-[11px]">
                Statutory Multi-Department Line Clear Interlock Barrier
              </span>
              Under Indian Railways General &amp; Subsidiary Rules (G&amp;SR 4.14), block possession CANNOT be relinquished to Section Controller or Station Master until all bundled engineering departments have physically cleared track, stabled mobile plant, and certified structural readiness.
            </div>
          </div>

          {/* 3-Department Readiness Gate Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileCheck2 size={15} className="text-blue-600" />
                3-Department Readiness Gate Checklist
              </h3>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {allSigned ? '3 of 3 Certified' : '2 of 3 Certified · 1 Pending'}
              </span>
            </div>

            <div className="space-y-3">
              {/* 1. Permanent Way (ENG) */}
              <div className={`p-4 rounded-xl border transition-all ${
                engSigned 
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' 
                  : 'bg-white border-slate-300 text-slate-900'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Wrench size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-tight text-slate-900">
                          1. Permanent Way (ENG)
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          P.WAY
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        Track cleared of tamping machines, ballast dressed, fishplates bolted.
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Signee: IR-ENG-084 (Sr. Section Engineer P.Way) · 03:42 hrs
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setEngSigned(!engSigned)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                      engSigned
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {engSigned ? (
                      <>
                        <CheckCircle2 size={14} />
                        SIGNED / READY
                      </>
                    ) : (
                      'PENDING ➔ Certify'
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Electrical Traction (TRD) - Starts PENDING */}
              <div className={`p-4 rounded-xl border-2 transition-all ${
                trdSigned 
                  ? 'bg-emerald-50/60 border-emerald-400 text-emerald-950' 
                  : 'bg-amber-50/70 border-amber-400 text-amber-950 shadow-xs'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-tight text-slate-900">
                          2. Electrical Traction (TRD)
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                          25kV OHE
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 font-medium">
                        25kV catenary earth wire discharged, tower car stabled, OHE re-energized.
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Signee: IR-TRD-441 (SSE Traction Distribution · GZB Sector)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setTrdSigned(!trdSigned)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                      trdSigned
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-sm animate-pulse'
                    }`}
                  >
                    {trdSigned ? (
                      <>
                        <CheckCircle2 size={14} />
                        SIGNED / READY
                      </>
                    ) : (
                      <>
                        <Clock size={13} />
                        PENDING ➔ Click to Certify
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Signalling & Telecom (S&T) */}
              <div className={`p-4 rounded-xl border transition-all ${
                sntSigned 
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' 
                  : 'bg-white border-slate-300 text-slate-900'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 border border-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Radio size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-tight text-slate-900">
                          3. Signalling &amp; Telecom (S&amp;T)
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-900 border border-teal-200">
                          AXLE COUNTER
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        Axle counter slot verified, point detection interlocked.
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Signee: IR-SNT-112 (SSE Signal Barhan · Delhi Div) · 03:44 hrs
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSntSigned(!sntSigned)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                      sntSigned
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {sntSigned ? (
                      <>
                        <CheckCircle2 size={14} />
                        SIGNED / READY
                      </>
                    ) : (
                      'PENDING ➔ Certify'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <ShieldAlert size={16} className="text-rose-600 shrink-0" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              {successMsg}
            </div>
          )}
        </div>

        {/* Modal Footer / Action Gate */}
        <div className="p-5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              {allSigned ? (
                <>
                  <Unlock size={14} className="text-emerald-600" />
                  <span className="text-emerald-700 font-black">Safety Interlock Unlocked: Ready for Line Clear</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-amber-600" />
                  <span className="text-amber-700 font-bold">Interlock Engaged: TRD Certification Required</span>
                </>
              )}
            </span>
            <p className="text-[10px] text-slate-400 font-mono">
              Authorized Authority: Section Controller / Station Master Joint Handback
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleReleasePossession}
              disabled={!allSigned || submitting}
              className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm ${
                allSigned && !submitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ring-2 ring-emerald-500/30'
                  : 'bg-slate-300 text-slate-500 border border-slate-300 cursor-not-allowed opacity-80'
              }`}
            >
              {allSigned ? <ShieldCheck size={16} /> : <Lock size={16} />}
              {submitting ? 'Executing Handback...' : 'Sanction Line Clear & Release Possession'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandbackInterlockModal;
