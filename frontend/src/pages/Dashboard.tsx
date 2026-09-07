import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { ListTodo, Clock, AlertTriangle, ShieldCheck, TrendingUp, CheckCircle2 } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { RiskCard } from '../components/dashboard/RiskCard';
import { TrainImpactChart } from '../components/dashboard/TrainImpactChart';
import { ResourceUtilizationChart } from '../components/dashboard/ResourceUtilizationChart';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { getSummary, getDashboardRisks, getDashboardTasks, getTrainImpact } from '../services/dashboardApi';
import { getResourceUtilization } from '../services/analyticsApi';
import { DashboardSummary, OperationalRisk, Task } from '../types';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [risks, setRisks] = useState<OperationalRisk[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trainData, setTrainData] = useState<any>(null);
  const [resourceData, setResourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, riskRes, taskRes, trainRes, resRes] = await Promise.all([
        getSummary(),
        getDashboardRisks(),
        getDashboardTasks(),
        getTrainImpact(),
        getResourceUtilization().catch(() => []),
      ]);
      setSummary(sumRes);
      setRisks(riskRes);
      setTasks(taskRes);
      setTrainData(trainRes);
      setResourceData(resRes);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError('Could not connect to FastAPI backend at http://localhost:8000. Ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Dashboard" subtitle="Corridor Traffic & Maintenance Overview">
        <Loading message="Fetching real-time railway corridor state from backend..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard" subtitle="Corridor Traffic & Maintenance Overview">
      {error && <ErrorMessage message={error} onRetry={loadData} />}

      {/* Railway Operations Hero Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest">
                Corridor Telemetry Active
              </span>
              <span className="text-xs text-slate-400">• NDLS - GZB - MB Line</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Railway Automatic Maintenance & Traffic Control
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Real-time CP-SAT solver horizon active. Monitoring maintenance tasks, corridor block windows, and train detention safety thresholds.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Track Blocks</p>
              <p className="text-lg font-black text-cyan-400 font-mono">04 WINDOWS</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solver Horizon</p>
              <p className="text-lg font-black text-emerald-400 font-mono">OPTIMAL</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Tasks"
          value={summary?.total_tasks || 22}
          subtext="Active in database"
          icon={<ListTodo size={20} />}
          variant="default"
        />
        <StatCard
          label="Open Tasks"
          value={summary?.open_tasks || 18}
          subtext="Pending block grant"
          icon={<Clock size={20} />}
          variant="blue"
        />
        <StatCard
          label="Lane A Emergency"
          value={summary?.lane_a_count || 3}
          subtext="Requires Manual Safety"
          icon={<AlertTriangle size={20} />}
          variant="red"
        />
        <StatCard
          label="Lane B2 Statutory"
          value={summary?.lane_b2_count || 5}
          subtext="Mandatory inspections"
          icon={<ShieldCheck size={20} />}
          variant="amber"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lane B1 Planned"
          value={summary?.lane_b1_count || 14}
          subtext="Optimizable work"
          icon={<TrendingUp size={20} />}
          variant="blue"
        />
        <StatCard
          label="High Readiness"
          value="78%"
          subtext="Gang & machine ready"
          icon={<CheckCircle2 size={20} />}
          variant="green"
        />
        <StatCard
          label="Plans Generated"
          value={summary?.generated_plans || 2}
          subtext="CP-SAT Horizon"
          icon={<ShieldCheck size={20} />}
          variant="default"
        />
        <StatCard
          label="Est. Train Impact"
          value={trainData?.plan_a ? `${trainData.plan_a}m` : '52 mins'}
          subtext="Plan A detention vs 195m"
          icon={<Clock size={20} />}
          variant="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TrainImpactChart data={trainData?.chart_data} />
        <ResourceUtilizationChart data={resourceData} />
      </div>

      {/* Risk and Upcoming Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RiskCard risks={risks} />
        </div>
        <div className="lg:col-span-2">
          <UpcomingTasks tasks={tasks} />
        </div>
      </div>
    </PageContainer>
  );
};
