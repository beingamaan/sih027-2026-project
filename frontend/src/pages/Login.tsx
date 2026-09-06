import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, ShieldCheck } from 'lucide-react';
import type { UserRole } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('SECTION_CONTROLLER');
  const [employeeId, setEmployeeId] = useState('EMP-90823');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_role', role);
    localStorage.setItem('employee_id', employeeId);
    localStorage.setItem('logged_in', 'true');

    switch (role) {
      case 'FIELD_SUPERVISOR':
        navigate('/field');
        break;
      case 'SECTION_CONTROLLER':
      case 'DIVISIONAL_OFFICER':
      default:
        navigate('/dashboard');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-800">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-600/30">
            <Train size={30} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">SIH26027 Portal</h2>
          <p className="text-xs text-slate-500 mt-0.5">Availability-First Block Planning Decision Support</p>
          <span className="mt-2 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            PROTOTYPE AUTHENTICATION
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SECTION_CONTROLLER">SECTION CONTROLLER</option>
              <option value="DIVISIONAL_OFFICER">DIVISIONAL OFFICER</option>
              <option value="FIELD_SUPERVISOR">FIELD SUPERVISOR</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              defaultValue="prototype"
              className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Enter Operations Console
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-[11px] text-amber-800 text-center">
            Advisory Decision Support — Final block sanction and railway safety procedures remain with authorized Railway personnel.
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-blue-600" />
          <span>Prototype demonstration using synthetic data. Not for live Railway operations.</span>
        </div>
      </div>
    </div>
  );
};
