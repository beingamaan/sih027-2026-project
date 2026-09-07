import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { TaskDetails } from './pages/TaskDetails';
import { Planning } from './pages/Planning';
import { PlanDetails } from './pages/PlanDetails';
import { WhatIf } from './pages/WhatIf';
import { TrainGraph } from './pages/TrainGraph';
import { BlockDetails } from './pages/BlockDetails';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';
import { FieldHome } from './pages/FieldHome';
import { FieldTasks } from './pages/FieldTasks';
import { FieldExecution } from './pages/FieldExecution';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { AddTaskPage } from './pages/AddTaskPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        {/* Controller / Officer routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/add-task" element={<AddTaskPage />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/plans/:id" element={<PlanDetails />} />
        <Route path="/train-graph" element={<TrainGraph />} />
        <Route path="/blocks/:id" element={<BlockDetails />} />
        <Route path="/what-if" element={<WhatIf />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        {/* Field Supervisor routes */}
        <Route path="/field" element={<FieldHome />} />
        <Route path="/field/tasks" element={<FieldTasks />} />
        <Route path="/field/execute/:taskId" element={<FieldExecution />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
