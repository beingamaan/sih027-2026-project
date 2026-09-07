import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TaskForm } from './TaskForm';
import { useNavigate } from 'react-router-dom';

export const AddTaskPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to tasks page after successful task creation
    setTimeout(() => {
      navigate('/tasks');
    }, 1200);
  };

  return (
    <PageContainer title="Add Maintenance Task" subtitle="Log new corridor maintenance work order into database">
      <div className="max-w-3xl mx-auto">
        <TaskForm onSuccess={handleSuccess} />
      </div>
    </PageContainer>
  );
};
