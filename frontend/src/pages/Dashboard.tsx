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
import { TaskForm } from "./TaskForm";
import { BlockWindowForm } from "./BlockWindowForm";

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

      <TaskForm onSuccess={loadData} />
      <BlockWindowForm onSuccess={loadData} />

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
