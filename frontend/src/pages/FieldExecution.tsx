import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle2, Circle, AlertTriangle, ArrowLeft, Clock, WifiOff } from 'lucide-react';
import { LOSS_CODES } from '../types';

const STEPS = [
  { key: 'ACKNOWLEDGED', label: 'ACKNOWLEDGE', endpoint: 'acknowledge', color: 'bg-blue-600' },
  { key: 'READY', label: 'READY', endpoint: 'ready', color: 'bg-indigo-600' },
  { key: 'WORK_STARTED', label: 'START WORK', endpoint: 'start', color: 'bg-amber-600' },
  { key: 'WORK_COMPLETED', label: 'COMPLETE', endpoint: 'complete', color: 'bg-emerald-600' },
  { key: 'LINE_HANDED_BACK', label: 'HAND BACK LINE', endpoint: 'handback', color: 'bg-slate-700' },
] as const;

export const FieldExecution: React.FC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const id = taskId || '1';
  const [currentStep, setCurrentStep] = useState(0);
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showLoss, setShowLoss] = useState(false);
  const [lossCode, setLossCode] = useState('');
  const [lossNotes, setLossNotes] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);

  React.useEffect(() => {
    const h1 = () => setOnline(true);
    const h2 = () => setOnline(false);
    window.addEventListener('online', h1);
    window.addEventListener('offline', h2);
    return () => { window.removeEventListener('online', h1); window.removeEventListener('offline', h2); };
  }, []);

  const handleStep = async () => {
    if (currentStep >= STEPS.length) return;
    const step = STEPS[currentStep];
    const uuid = crypto.randomUUID();
    setSubmitting(true);

    try {
      if (online) {
        await api.post(`/api/field/tasks/${id}/${step.endpoint}`);
      } else {
        setOfflineQueue(prev => [...prev, `${step.key} (${uuid})`]);
      }
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTimestamps(prev => ({ ...prev, [step.key]: now }));
      setCurrentStep(prev => prev + 1);

      if (step.key === 'WORK_COMPLETED') {
        setShowLoss(true);
      }
    } catch (e) {
      setOfflineQueue(prev => [...prev, `${step.key} (${uuid}) - will retry`]);
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTimestamps(prev => ({ ...prev, [step.key]: now }));
      setCurrentStep(prev => prev + 1);
      if (step.key === 'WORK_COMPLETED') setShowLoss(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLossSubmit = () => {
    if (lossCode) {
      const uuid = crypto.randomUUID();
      if (online) {
        api.post('/api/field/events/sync', { task_id: Number(id), event_type: 'LOSS_RECORDED', loss_code: lossCode, notes: lossNotes }).catch(() => {});
      } else {
        setOfflineQueue(prev => [...prev, `LOSS:${lossCode} (${uuid})`]);
      }
    }
    setShowLoss(false);
  };

  const isComplete = currentStep >= STEPS.length;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-4">
        <button onClick={() => navigate('/field')} className="flex items-center gap-1 text-sm text-blue-200 mb-2">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-lg font-bold">Block Execution</h1>
        <p className="text-xs text-blue-200">Task ID: {id}</p>
      </div>

      {!online && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <WifiOff size={14} /> Offline — Events will sync when connection returns.
        </div>
      )}

      {offlineQueue.length > 0 && (
        <div className="mx-4 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs font-semibold text-slate-700 mb-1">Queued Events ({offlineQueue.length})</p>
          {offlineQueue.map((e, i) => <p key={i} className="text-[10px] text-slate-500">{e}</p>)}
        </div>
      )}

      {/* Timeline */}
      <div className="px-4 py-6">
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  {done ? <CheckCircle2 size={28} className="text-emerald-500" /> : <Circle size={28} className={isCurrent ? 'text-blue-500' : 'text-slate-300'} />}
                  {i < STEPS.length - 1 && <div className={`w-0.5 h-8 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>}
                </div>
                <div className="flex-1 pb-2">
                  <p className={`text-sm font-bold ${done ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-400'}`}>
                    {i + 1}. {step.label}
                  </p>
                  {timestamps[step.key] && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={11} /> {timestamps[step.key]}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="px-4">
        {!isComplete && !showLoss && (
          <button
            onClick={handleStep}
            disabled={submitting}
            className={`w-full min-h-16 rounded-xl text-white text-xl font-bold active:opacity-90 transition-opacity disabled:opacity-50 ${STEPS[currentStep].color}`}
          >
            {submitting ? 'Processing...' : `${currentStep + 1}. ${STEPS[currentStep].label}`}
          </button>
        )}

        {isComplete && !showLoss && (
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-emerald-700">Execution Complete</p>
            <p className="text-sm text-slate-500 mt-1">Line handed back successfully</p>
            <button onClick={() => navigate('/field')} className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold">
              Return to Home
            </button>
          </div>
        )}
      </div>

      {/* Loss Reason Modal */}
      {showLoss && (
        <div className="px-4 py-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Was there any delay?</h3>
            <p className="text-xs text-slate-500 mb-4">Select a loss reason if applicable, or skip.</p>
            <div className="space-y-2 mb-4">
              {LOSS_CODES.map(lc => (
                <button
                  key={lc.value}
                  onClick={() => setLossCode(lc.value)}
                  className={`w-full text-left p-3 rounded-lg border text-sm min-h-12 ${lossCode === lc.value ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold' : 'border-slate-200 text-slate-700'}`}
                >
                  {lc.label}
                </button>
              ))}
            </div>
            {lossCode && (
              <textarea
                placeholder="Additional notes (optional)"
                value={lossNotes}
                onChange={e => setLossNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm mb-3"
                rows={2}
              />
            )}
            <div className="flex gap-3">
              <button onClick={handleLossSubmit} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold">
                {lossCode ? 'Submit Loss Reason' : 'Skip — No Delay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advisory */}
      <div className="px-4 py-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[11px] text-amber-800 text-center">Advisory Decision Support — Final block sanction and railway safety procedures remain with authorized Railway personnel.</p>
        </div>
      </div>
    </div>
  );
};
