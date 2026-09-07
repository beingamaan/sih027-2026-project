import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Wifi, WifiOff, MapPin, Clock, Wrench, Shield, ChevronRight, Home, ListTodo, Bell, User } from 'lucide-react';
import type { Task } from '../types';

const readinessLabel = (t: Task) => {
  const missing = [!t.material_ready && 'Material', !t.ptw_ready && 'PTW'].filter(Boolean);
  if (missing.length === 0) return { level: 'HIGH' as const, color: 'bg-emerald-100 text-emerald-700' };
  if (missing.length === 1) return { level: 'MEDIUM' as const, color: 'bg-amber-100 text-amber-700' };
  return { level: 'LOW' as const, color: 'bg-red-100 text-red-700' };
};

export const FieldHome: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    api.get('/api/tasks/field').then(r => setTasks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  // Backend already filters: only emergency + planner-scheduled tasks are returned
  const fieldTasks = tasks;

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">My Assigned Blocks</h1>
            <p className="text-xs text-blue-200">Field Supervisor View</p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${online ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {!online && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <WifiOff size={14} /> Offline — Events will sync when connection returns.
        </div>
      )}

      {/* Task Cards */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading blocks...</div>
        ) : fieldTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No assigned blocks</div>
        ) : fieldTasks.map((t) => {
          const r = readinessLabel(t);
          const isCompleted = t.status === 'LINE_HANDED_BACK' || t.status === 'WORK_COMPLETED';
          const isStatutory = t.lane === 'B2_STATUTORY';

          return (
            <button
              key={t.id}
              onClick={() => navigate(`/field/execute/${t.id}`)}
              className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left active:bg-slate-50 transition-colors shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{t.task_code}</span>
                    {isCompleted ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                        ✅ Completed
                      </span>
                    ) : isStatutory ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 animate-pulse">
                        ⚠️ Statutory Due
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                        ⏰ Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-700 mt-1">{t.work_type.replace(/_/g, ' ')}</p>
                </div>
                <ChevronRight size={20} className="text-slate-400 shrink-0" />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-600">
                <span className="flex items-center gap-1"><MapPin size={12} />KM {t.km_from} – {t.km_to}</span>
                <span className="flex items-center gap-1"><Clock size={12} />Window: 02:00 – 05:00</span>
                <span className="flex items-center gap-1"><Wrench size={12} />{t.department}</span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                    {t.lane}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${r.color}`}>
                    Readiness: {r.level}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  Execute →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Advisory */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[11px] text-amber-800 text-center">Advisory Decision Support — Final block sanction and railway safety procedures remain with authorized Railway personnel.</p>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">Prototype demonstration using synthetic data.</p>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 safe-bottom z-50">
        <button onClick={() => navigate('/field')} className="flex flex-col items-center gap-0.5 text-blue-600"><Home size={20} /><span className="text-[10px] font-semibold">Home</span></button>
        <button onClick={() => navigate('/field/tasks')} className="flex flex-col items-center gap-0.5 text-slate-400"><ListTodo size={20} /><span className="text-[10px]">Tasks</span></button>
        <button onClick={() => navigate('/notifications')} className="flex flex-col items-center gap-0.5 text-slate-400"><Bell size={20} /><span className="text-[10px]">Alerts</span></button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-0.5 text-slate-400"><User size={20} /><span className="text-[10px]">Profile</span></button>
      </nav>
    </div>
  );
};
