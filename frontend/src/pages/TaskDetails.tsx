import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { TaskDetailsView } from '../components/tasks/TaskDetails';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { getTaskDetails, classifyTask, getTaskReadiness } from '../services/taskApi';
import { Task, TaskClassification, TaskReadiness } from '../types';
import { ChevronLeft } from 'lucide-react';

export const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [classification, setClassification] = useState<TaskClassification | null>(null);
  const [readiness, setReadiness] = useState<TaskReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [t, r] = await Promise.all([
        getTaskDetails(id),
        getTaskReadiness(id).catch(() => null),
      ]);
      setTask(t);
      setReadiness(r);
    } catch (err: any) {
      console.error('Failed to load task details:', err);
      setError('Unable to load task from backend. Verify task ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleClassify = async () => {
    if (!id) return;
    setClassifying(true);
    try {
      const res = await classifyTask(id);
      setClassification(res);
    } catch (err: any) {
      console.error('Classification error:', err);
    } finally {
      setClassifying(false);
    }
  };

  return (
    <PageContainer title="Task Diagnostic & Readiness" subtitle="Inspection & scheduling eligibility validation">
      <div className="mb-4">
        <Link to="/tasks" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
          <ChevronLeft size={16} /> Back to Task Registry
        </Link>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadData} />}

      {loading ? (
        <Loading message="Loading task details from database..." />
      ) : task ? (
        <TaskDetailsView
          task={task}
          classification={classification}
          readiness={readiness}
          onClassify={handleClassify}
          classifying={classifying}
        />
      ) : (
        <p className="text-slate-500">Task not found.</p>
      )}
    </PageContainer>
  );
};
