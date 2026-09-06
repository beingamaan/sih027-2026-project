import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { User, Shield, LogOut, Clock, Building2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('user_role') || 'SECTION_CONTROLLER';
  const employeeId = localStorage.getItem('employee_id') || 'EMP-90823';

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('employee_id');
    localStorage.removeItem('logged_in');
    navigate('/login');
  };

  return (
    <PageContainer title="Profile" subtitle="Account & session information">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{employeeId}</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">{role.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Shield size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-sm font-semibold text-slate-800">{role.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Building2 size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Division</p>
                <p className="text-sm font-semibold text-slate-800">DIV1</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Clock size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Last Sync</p>
                <p className="text-sm font-semibold text-slate-800">{new Date().toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700">
          <LogOut size={18} /> Logout
        </button>

        <p className="mt-6 text-center text-[11px] text-slate-400">Prototype demonstration using synthetic data. Not for live Railway operations.</p>
      </div>
    </PageContainer>
  );
};
