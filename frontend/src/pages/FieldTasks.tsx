import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CheckSquare, Square, AlertTriangle, ChevronRight, Home, ListTodo, Bell, User } from 'lucide-react';
import type { Task } from '../types';

const CHECKLIST_ITEMS = [
  'Gang available',
  'Machine arrived / reachable',
  'Material available',
  'PTW / Isolation / Disconnection ready',
  'Safety tools / PPE ready',
  'Worksite access confirmed',
];

export const FieldTasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [checks, setChecks] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const [acknowledged, setAcknowledged] = useState<Record<number, string>>({});

  useEffect(() => {
    api.get('/api/tasks/field').then(r => setTasks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleCheck = (i: number) => {
    const next = [...checks];
    next[i] = !next[i];
    setChecks(next);
  };

  const checkedCount = checks.filter(Boolean).length;
  const readiness = checkedCount === CHECKLIST_ITEMS.length ? 'HIGH' : checkedCount >= 4 ? 'MEDIUM' : 'LOW';

  const handleAcknowledge = (taskId: number) => {
    api.post(`/api/field/tasks/${taskId}/acknowledge`).catch(() => {});
    setAcknowledged(prev => ({ ...prev, [taskId]: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }));
  };

  const laneBadge = (lane: string) => {
    if (lane === 'A_EMERGENCY') return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700">🚨 Emergency</span>;
    if (lane === 'B2_STATUTORY') return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">B2 Statutory</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">B1 Planned</span>;
  };

  // Backend already filters: only emergency + planner-scheduled tasks are returned
  const fieldTasks = tasks;

  const filteredTasks = selectedDept === 'ALL' 
    ? fieldTasks 
    : fieldTasks.filter(t => t.department === selectedDept);

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <div className="bg-blue-700 text-white px-4 py-4">
        <h1 className="text-lg font-bold">Field Tasks</h1>
        <p className="text-xs text-blue-200">Tap a task for readiness checklist</p>

        {/* Department Filter Bar */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {['ALL', 'TRD', 'ENGINEERING', 'S_AND_T'].map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedDept === dept
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'bg-blue-800/60 text-blue-100 hover:bg-blue-800'
              }`}
            >
              {dept === 'S_AND_T' ? 'S&T' : dept}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : filteredTasks.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setSelectedTask(selectedTask?.id === t.id ? null : t)} className="w-full p-4 text-left flex items-center justify-between active:bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{t.task_code}</span>
                  {laneBadge(t.lane)}
                </div>
                <p className="text-xs text-slate-500 mt-1">{t.department} · {t.km_from}–{t.km_to} km</p>
                {t.lane === 'A_EMERGENCY' && (
                  <p className="text-[10px] text-red-600 mt-1 font-medium">Emergency — Outside Optimizer</p>
                )}
              </div>
              <ChevronRight size={18} className={`text-slate-400 transition-transform ${selectedTask?.id === t.id ? 'rotate-90' : ''}`} />
            </button>

            {/* Plan change mock */}
            {t.id % 5 === 0 && !acknowledged[t.id] && (
              <div className="mx-4 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 mb-1">⚠ Plan Changed</p>
                <div className="flex gap-4 text-xs mb-2">
                  <div><span className="text-slate-500">OLD:</span> <span className="line-through">02:00–05:00</span></div>
                  <div><span className="text-slate-500">NEW:</span> <span className="font-semibold text-amber-900">02:30–05:30</span></div>
                </div>
                <button onClick={() => handleAcknowledge(t.id)} className="w-full bg-amber-600 text-white py-2.5 rounded-lg text-sm font-bold active:bg-amber-700">ACKNOWLEDGE</button>
              </div>
            )}
            {acknowledged[t.id] && (
              <div className="mx-4 mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium">
                ✓ Acknowledged at {acknowledged[t.id]}
              </div>
            )}

            {/* Readiness Checklist */}
            {selectedTask?.id === t.id && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Readiness Checklist</h4>
                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map((item, i) => (
                    <button key={i} onClick={() => toggleCheck(i)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 active:bg-slate-100 min-h-12">
                      {checks[i] ? <CheckSquare size={22} className="text-emerald-600 shrink-0" /> : <Square size={22} className="text-slate-400 shrink-0" />}
                      <span className={`text-sm ${checks[i] ? 'text-slate-800' : 'text-slate-500'}`}>{item}</span>
                    </button>
                  ))}
                </div>
                <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${readiness === 'HIGH' ? 'bg-emerald-50 border border-emerald-200' : readiness === 'MEDIUM' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  {readiness === 'LOW' && <AlertTriangle size={16} className="text-red-600" />}
                  <span className={`text-sm font-bold ${readiness === 'HIGH' ? 'text-emerald-700' : readiness === 'MEDIUM' ? 'text-amber-700' : 'text-red-700'}`}>
                    Readiness: {readiness}
                  </span>
                </div>
                {readiness === 'LOW' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 font-semibold">NOT READY — Confirm with Controller before starting.</p>
                  </div>
                )}
                <button onClick={() => navigate(`/field/execute/${t.id}`)} className="w-full mt-3 bg-blue-600 text-white py-3 rounded-lg text-sm font-bold active:bg-blue-700">
                  Proceed to Execution →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-50">
        <button onClick={() => navigate('/field')} className="flex flex-col items-center gap-0.5 text-slate-400"><Home size={20} /><span className="text-[10px]">Home</span></button>
        <button onClick={() => navigate('/field/tasks')} className="flex flex-col items-center gap-0.5 text-blue-600"><ListTodo size={20} /><span className="text-[10px] font-semibold">Tasks</span></button>
        <button onClick={() => navigate('/notifications')} className="flex flex-col items-center gap-0.5 text-slate-400"><Bell size={20} /><span className="text-[10px]">Alerts</span></button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-0.5 text-slate-400"><User size={20} /><span className="text-[10px]">Profile</span></button>
      </nav>
    </div>
  );
};
