import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SidebarProvider, useSidebar } from './components/layout/Sidebar';
import { AuthProvider, useAuth, RailwayRole } from './context/AuthContext';
import { CommandCenter } from './pages/CommandCenter';
import { DepartmentWorkspace } from './pages/DepartmentWorkspace';
import { GovernanceAudit } from './pages/GovernanceAudit';
import { ReportsInsights } from './pages/ReportsInsights';
import { DataArchive } from './pages/DataArchive';
import { FieldExecution } from './pages/FieldExecution';
import { FieldInspect } from './pages/FieldInspect';
import { StationAwareness } from './pages/StationAwareness';
import { TasksPage } from './pages/TasksPage';
import { TaskRegister } from './pages/TaskRegister';
import { Planning } from './pages/Planning';
import { DualPlanEngine } from './pages/DualPlanEngine';
import { TrainGraph } from './pages/TrainGraph';
import { TrainGraphPage } from './pages/TrainGraphPage';
import { Login } from './pages/Login';
import { Forbidden403 } from './pages/Forbidden403';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Main Layout Wrapper ensuring clean passthrough without redundant margin offsets
const MainLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Dynamic Landing Redirect based on authenticated user session profile
const DynamicLandingRedirect: React.FC = () => {
  const { isAuthenticated, userProfile, currentProfile } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const landing = userProfile?.landing_route || currentProfile.landingRoute || '/command';
  return <Navigate to={landing} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <MainLayoutWrapper>
            <Routes>
              <Route path="/" element={<DynamicLandingRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/403" element={<Forbidden403 />} />
              
              {/* SECTION_CONTROLLER & DIVISIONAL_OFFICER COMMAND WORKSPACE */}
              <Route 
                path="/command" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER', 'DIVISIONAL_OFFICER']}>
                    <CommandCenter />
                  </ProtectedRoute>
                } 
              />
              {/* /dashboard immediately redirects to authenticated landing route (e.g. /command) */}
              <Route path="/dashboard" element={<DynamicLandingRedirect />} />
              <Route 
                path="/train-graph" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER']}>
                    <TrainGraphPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/occupancy" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER']}>
                    <TrainGraphPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/planning" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER']}>
                    <DualPlanEngine />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dual-plan" 
                element={
                  <ProtectedRoute allowedRoles={['SECTION_CONTROLLER']}>
                    <DualPlanEngine />
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
                    <TaskRegister />
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
              <Route 
                path="/station/memos" 
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
                path="/reports" 
                element={
                  <ProtectedRoute allowedRoles={['DIVISIONAL_OFFICER']}>
                    <ReportsInsights />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/archive" 
                element={
                  <ProtectedRoute allowedRoles={['DIVISIONAL_OFFICER']}>
                    <DataArchive />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/audit" 
                element={
                  <ProtectedRoute allowedRoles={['DIVISIONAL_OFFICER']}>
                    <DataArchive />
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
