import React, { useState } from 'react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const BlockWindowForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [startTime, setStartTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)
  );
  const [kmStart, setKmStart] = useState(0);
  const [kmEnd, setKmEnd] = useState(58);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.post('/api/dashboard/block-windows', {
        start_time: startTime,
        end_time: endTime,
        km_start: kmStart,
        km_end: kmEnd,
      });
      setMsg({ text: 'Block window added successfully!', ok: true });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to add block window', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-slate-800">Add Block Window</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">KM Start</label>
            <input
              type="number"
              min={0}
              value={kmStart}
              onChange={e => setKmStart(Number(e.target.value))}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">KM End</label>
            <input
              type="number"
              min={0}
              value={kmEnd}
              onChange={e => setKmEnd(Number(e.target.value))}
              required
              className={inputClass}
            />
          </div>
        </div>
        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Add Block Window
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
