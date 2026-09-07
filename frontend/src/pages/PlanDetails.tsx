import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Timeline } from '../components/planning/Timeline';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { getPlanDetails, approvePlan, rejectPlan, overridePlan } from '../services/planApi';
import { Plan } from '../types';
import { CheckCircle2, XCircle, AlertOctagon, ChevronLeft, ShieldAlert } from 'lucide-react';

export const PlanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'override' | null>(null);
  const [reason, setReason] = useState('');

  const loadPlan = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlanDetails(id);
      setPlan(data);
    } catch (err: any) {
      console.error('Plan loading failed:', err);
      setError('Unable to load plan. Ensure plan ID exists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [id]);

  const handleAction = async () => {
    if (!id || !modalType) return;
    setActionLoading(true);
    try {
      if (modalType === 'approve') {
        await approvePlan(id, reason || 'Authorized by Chief Operations Manager');
      } else if (modalType === 'reject') {
        await rejectPlan(id, reason || 'Rejected due to corridor conflict');
      } else if (modalType === 'override') {
        await overridePlan(id, reason || 'Planner manual override applied');
      }
      setModalType(null);
      setReason('');
      await loadPlan();
    } catch (err: any) {
      console.error('Action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageContainer><Loading message="Loading corridor plan details..." /></PageContainer>;
  if (!plan) return <PageContainer><p>Plan not found</p></PageContainer>;

  return (
    <PageContainer title={`Plan Authority: ${plan.plan_code}`} subtitle="Human authorization & operational lock gate">
      <div className="mb-4">
        <button onClick={() => navigate('/planning')} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
          <ChevronLeft size={16} /> Back to Planning Matrix
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Plan Summary Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-mono text-slate-900">{plan.plan_code}</h2>
            <Badge variant={plan.approval_status === 'APPROVED' ? 'green' : plan.approval_status === 'REJECTED' ? 'red' : 'amber'}>
              {plan.approval_status}
            </Badge>
            <Badge variant="blue">{plan.plan_type}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Planning Horizon: {plan.horizon_start} to {plan.horizon_end} | Solver: {plan.solver_status}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="success"
            size="sm"
            onClick={() => setModalType('approve')}
            disabled={plan.approval_status === 'APPROVED'}
            icon={<CheckCircle2 size={16} />}
          >
            Approve Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalType('override')}
            icon={<AlertOctagon size={16} />}
          >
            Override Plan
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setModalType('reject')}
            disabled={plan.approval_status === 'REJECTED'}
            icon={<XCircle size={16} />}
          >
            Reject Plan
          </Button>
        </div>
      </div>

      {/* Caution alert regarding human approval requirement */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 mb-6 text-xs text-amber-900">
        <ShieldAlert size={20} className="text-amber-700 shrink-0" />
        <div>
          <strong>Statutory Requirement: </strong>
          All automatically generated block plans must be reviewed and formally authorized by the Section Controller before being transmitted to field gangs.
        </div>
      </div>

      {/* Schedule Timeline */}
      <Timeline tasks={plan.tasks || []} />

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={
          modalType === 'approve'
            ? 'Confirm Plan Authorization'
            : modalType === 'reject'
            ? 'Reject Operational Plan'
            : 'Manual Controller Override'
        }
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button
              variant={modalType === 'approve' ? 'success' : modalType === 'reject' ? 'danger' : 'secondary'}
              size="sm"
              loading={actionLoading}
              onClick={handleAction}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            {modalType === 'approve'
              ? 'Are you sure you want to approve this plan? Authorized block windows will be published to the field execution desk.'
              : 'Please enter a justification for audit logging:'}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason / controller remarks..."
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={3}
          />
        </div>
      </Modal>
    </PageContainer>
  );
};
