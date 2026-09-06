import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Bell, Check, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  { id: 1, code: 'NOTI_001', message: 'Plan A V3 generated for SEC_AB. 3 tasks bundled. Review and approve.', status: 'PENDING' as const, sent_at: '2026-09-05 14:30:00', type: 'Plan change', plan_version: 3 },
  { id: 2, code: 'NOTI_002', message: 'New task TSK_ENG_5 assigned to your block section SEC_BC.', status: 'SENT' as const, sent_at: '2026-09-05 13:00:00', type: 'New assignment', plan_version: 3 },
  { id: 3, code: 'NOTI_003', message: 'Readiness warning: Material not ready for TSK_TRD_2. Contact supply chain.', status: 'PENDING' as const, sent_at: '2026-09-05 12:15:00', type: 'Readiness warning', plan_version: 3 },
  { id: 4, code: 'NOTI_004', message: 'Plan A V2 approved by Divisional Officer. Block sanctioning may proceed.', status: 'ACKNOWLEDGED' as const, sent_at: '2026-09-04 18:00:00', type: 'Approval', plan_version: 2 },
  { id: 5, code: 'NOTI_005', message: 'Replan requested for SEC_CD due to machine unavailability. Plan B activated.', status: 'ACKNOWLEDGED' as const, sent_at: '2026-09-04 10:00:00', type: 'Replan request', plan_version: 2 },
  { id: 6, code: 'NOTI_006', message: 'B2 statutory task TSK_TRD_3 approaching deadline. Schedule within 48 hours.', status: 'EXPIRED' as const, sent_at: '2026-09-03 08:00:00', type: 'Readiness warning', plan_version: 1 },
];

const statusColor = (s: string) => {
  switch (s) {
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    case 'SENT': return 'bg-blue-100 text-blue-700';
    case 'ACKNOWLEDGED': return 'bg-emerald-100 text-emerald-700';
    case 'EXPIRED': return 'bg-slate-100 text-slate-500';
    default: return 'bg-slate-100 text-slate-500';
  }
};

const typeIcon = (t: string) => {
  switch (t) {
    case 'Plan change': return <Clock size={14} className="text-blue-500" />;
    case 'Readiness warning': return <AlertTriangle size={14} className="text-amber-500" />;
    case 'Approval': return <Check size={14} className="text-emerald-500" />;
    case 'Replan request': return <AlertTriangle size={14} className="text-red-500" />;
    default: return <Bell size={14} className="text-slate-400" />;
  }
};

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('PENDING');

  const handleAcknowledge = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'ACKNOWLEDGED' as const } : n));
  };

  const groups = [
    { key: 'PENDING', label: 'Pending', items: notifications.filter(n => n.status === 'PENDING') },
    { key: 'SENT', label: 'Sent', items: notifications.filter(n => n.status === 'SENT') },
    { key: 'ACKNOWLEDGED', label: 'Acknowledged', items: notifications.filter(n => n.status === 'ACKNOWLEDGED') },
    { key: 'EXPIRED', label: 'Expired', items: notifications.filter(n => n.status === 'EXPIRED') },
  ];

  return (
    <PageContainer title="Notifications" subtitle="Plan updates, assignments, and alerts">
      <div className="space-y-4">
        {groups.map(g => (
          <div key={g.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setExpandedGroup(expandedGroup === g.key ? null : g.key)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColor(g.key)}`}>{g.label}</span>
                <span className="text-sm text-slate-600">{g.items.length} notification{g.items.length !== 1 ? 's' : ''}</span>
              </div>
              {expandedGroup === g.key ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {expandedGroup === g.key && (
              <div className="border-t border-slate-100">
                {g.items.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">No notifications</div>
                ) : g.items.map(n => (
                  <div key={n.id} className="p-4 border-b border-slate-50 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{typeIcon(n.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">{n.type}</span>
                          {n.plan_version && <span className="text-[10px] text-slate-400">Plan V{n.plan_version}</span>}
                        </div>
                        <p className="text-sm text-slate-800">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{n.sent_at}</p>
                      </div>
                    </div>
                    {n.status === 'PENDING' && (
                      <button onClick={() => handleAcknowledge(n.id)} className="mt-3 w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] text-slate-400">Prototype demonstration using synthetic data. Not for live Railway operations.</p>
    </PageContainer>
  );
};
