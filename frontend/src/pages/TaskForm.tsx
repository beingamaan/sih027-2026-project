import React, { useState } from 'react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LaneType } from '../types';

export const TaskForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(90);
  const [lane, setLane] = useState<LaneType>('B1_PLANNED');
  const [department, setDepartment] = useState('ENGINEERING');
  const [sectionId, setSectionId] = useState(1);
  const [kmFrom, setKmFrom] = useState(10.0);
  const [kmTo, setKmTo] = useState(12.0);
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
        department,
        block_section_id: sectionId,
        km_from: kmFrom,
        km_to: kmTo,
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
  <h2 className="text-lg font-semibold mb-4 text-slate-800">Add New Maintenance Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description / Work Type</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Inspect OHE mast & sleeper replacement"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ENGINEERING">ENGINEERING (Track)</option>
              <option value="TRD">TRD (Electrical / Overhead)</option>
              <option value="S&T">S&T (Signals & Telecom)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Corridor / Block Section</label>
            <select
              value={sectionId}
              onChange={e => setSectionId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>SEC-01 (NDLS - GZB)</option>
              <option value={2}>SEC-02 (GZB - MB)</option>
              <option value={3}>SEC-03 (MB - BE)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">KM From</label>
            <input
              type="number"
              step="0.1"
              value={kmFrom}
              onChange={e => setKmFrom(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">KM To</label>
            <input
              type="number"
              step="0.1"
              value={kmTo}
              onChange={e => setKmTo(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority Lane</label>
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
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Add Maintenance Task
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
