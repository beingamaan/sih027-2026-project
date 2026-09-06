import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  getPlannedVsActual,
  getTrainImpactAnalytics,
  getResourceUtilization,
  getTaskCompletion,
} from '../services/analyticsApi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [plannedVsActual, setPlannedVsActual] = useState<any[]>([]);
  const [trainImpact, setTrainImpact] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [completion, setCompletion] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pva, ti, ru, tc] = await Promise.all([
          getPlannedVsActual(),
          getTrainImpactAnalytics(),
          getResourceUtilization(),
          getTaskCompletion(),
        ]);
        setPlannedVsActual(pva);
        setTrainImpact(ti);
        setResources(ru);
        setCompletion(tc);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch analytics from backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <PageContainer><Loading message="Crunching corridor performance metrics..." /></PageContainer>;

  return (
    <PageContainer title="Analytics & Operational KPI" subtitle="Corridor performance benchmarking (Simulated/Prototype)">
      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Planned vs Actual */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">Planned vs Actual Block Execution</h3>
            <p className="text-xs text-slate-500">7-Day task adherence</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plannedVsActual}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="planned" name="Planned Blocks" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="actual" name="Actual Executed" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diurnal Train Impact */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">Diurnal Train Delay Distribution</h3>
            <p className="text-xs text-slate-500">Passenger & freight detention impact by hour of day</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainImpact}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="m" />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" name="Unoptimized Delay" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="plan_a" name="Plan A Delay" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Utilization */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">Fleet & Machine Utilization</h3>
            <p className="text-xs text-slate-500">Average active deployment rate across fleet</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resources}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" height={45} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="utilization" name="Active Utilization %" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Completion */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">Departmental Work Distribution</h3>
            <p className="text-xs text-slate-500">Engineering vs TRD vs S&T completion count</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#10b981" stackId="a" />
                <Bar dataKey="in_progress" name="In Progress" fill="#f59e0b" stackId="a" />
                <Bar dataKey="pending" name="Pending" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
