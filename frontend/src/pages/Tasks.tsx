import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskTable } from '../components/tasks/TaskTable';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { getTasks } from '../services/taskApi';
import { Task } from '../types';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    department: '',
    lane: '',
    priority: '',
    status: '',
  });

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTasks({
        department: filters.department || undefined,
        lane: filters.lane || undefined,
        priority: filters.priority || undefined,
        status: filters.status || undefined,
      });
      setTasks(data);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setError('Unable to load tasks from backend. Please verify FastAPI is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ department: '', lane: '', priority: '', status: '' });
  };

  return (
    <PageContainer title="Maintenance Tasks Registry" subtitle="Direct repository of all corridor assets & defects">
      <TaskFilters
        department={filters.department}
        lane={filters.lane}
        priority={filters.priority}
        status={filters.status}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {error && <ErrorMessage message={error} onRetry={loadTasks} />}

      {loading ? (
        <Loading message="Filtering tasks from database..." />
      ) : (
        <TaskTable tasks={tasks} />
      )}
    </PageContainer>
  );
};
