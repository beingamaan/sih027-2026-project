import React, { useState } from 'react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LaneType } from '../types';

export const TaskForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(90);
  const [lane, setLane] = useState<LaneType>('B1_PLANNED');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.post('/api/tasks', {
        description,
        estimated_duration_minutes: duration,
        lane,
      });
      setMsg({ text: 'Task added successfully!', ok: true });
      setDescription('');
      setDuration(90);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to add task', ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-slate-800">Add New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Inspect OHE mast at KM 23"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lane</label>
          <select
            value={lane}
            onChange={e => setLane(e.target.value as LaneType)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="B1_PLANNED">B1 — Planned</option>
            <option value="B2_STATUTORY">B2 — Statutory</option>
            <option value="A_EMERGENCY">A — Emergency</option>
          </select>
        </div>
        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Add Task
        </Button>
      </form>
      {msg && (
        <div className={`mt-3 flex items-center gap-2 text-sm ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {msg.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}
    </div>
  );
};
