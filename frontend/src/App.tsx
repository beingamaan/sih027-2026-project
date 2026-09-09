import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, useSidebar } from './components/layout/Sidebar';
import { AuthProvider, useAuth, RailwayRole } from './context/AuthContext';
import { CommandCenter } from './pages/CommandCenter';
import { DepartmentWorkspace } from './pages/DepartmentWorkspace';
import { GovernanceAudit } from './pages/GovernanceAudit';
import { FieldExecution } from './pages/FieldExecution';
import { FieldInspect } from './pages/FieldInspect';
import { StationAwareness } from './pages/StationAwareness';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { Planning } from './pages/Planning';
import { TrainGraph } from './pages/TrainGraph';
import { Footer } from './components/layout/Footer';

// Main Layout Wrapper ensuring Footer is rendered ONLY ONCE at bottom of page content
const MainLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCollapsed } = useSidebar();
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F8F5]">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-[260px]'}`}>
        <Footer />
      </div>
    </div>
  );
};

import { ProtectedRoute } from './routes/ProtectedRoute';

// Dynamic Landing Redirect based on authenticated role profile
const DynamicLandingRedirect: React.FC = () => {
  const { currentProfile } = useAuth();
  return <Navigate to={currentProfile.landingRoute} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <MainLayoutWrapper>
            <Routes>
              <Route path="/" element={<DynamicLandingRedirect />} />
              
              {/* SECTION_CONTROLLER & DIVISIONAL_OFFICER COMMAND WORKSPACE */}
              <Route 
                path="/command" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER', 'DIVISIONAL_OFFICER']}>
                    <CommandCenter />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER', 'DIVISIONAL_OFFICER']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/train-graph" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER']}>
                    <TrainGraph />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/planning" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER']}>
                    <Planning />
                  </ProtectedRoute>
                } 
              />

              {/* DEPT_SUPERVISOR WORKSPACE */}
              <Route 
                path="/department" 
                element={
                  <ProtectedRoute allowedRoles={['DEPT_SUPERVISOR']}>
                    <DepartmentWorkspace />
                  </ProtectedRoute>
                } 
              />

              {/* SHARED TASKS: SECTION_CONTROLLER & DEPT_SUPERVISOR */}
              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER', 'DEPT_SUPERVISOR']}>
                    <TasksPage />
                  </ProtectedRoute>
                } 
              />

              {/* FIELD_EXEC_LEAD WORKSPACE */}
              <Route 
                path="/field" 
                element={
                  <ProtectedRoute allowedRoles={['FIELD_EXEC_LEAD']}>
                    <FieldExecution />
                  </ProtectedRoute>
                } 
              />

              {/* FIELD_INSPECTOR WORKSPACE */}
              <Route 
                path="/field/inspect" 
                element={
                  <ProtectedRoute allowedRoles={['FIELD_INSPECTOR']}>
                    <FieldInspect />
                  </ProtectedRoute>
                } 
              />

              {/* STATION_MASTER WORKSPACE */}
              <Route 
                path="/station" 
                element={
                  <ProtectedRoute allowedRoles={['STATION_MASTER']}>
                    <StationAwareness />
                  </ProtectedRoute>
                } 
              />

              {/* DIVISIONAL_OFFICER WORKSPACE */}
              <Route 
                path="/governance" 
                element={
                  <ProtectedRoute allowedRoles={['DIVISIONAL_OFFICER']}>
                    <GovernanceAudit />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/audit" 
                element={
                  <ProtectedRoute allowedRoles={['DIVISIONAL_OFFICER']}>
                    <GovernanceAudit />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback Catch-All */}
              <Route path="*" element={<DynamicLandingRedirect />} />
            </Routes>
          </MainLayoutWrapper>
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default App;
