import React from 'react';
import { Badge } from '../common/Badge';
import { LaneType } from '../../types';

interface LaneBadgeProps {
  lane: LaneType;
  showSubtitle?: boolean;
}

export const LaneBadge: React.FC<LaneBadgeProps> = ({ lane, showSubtitle = false }) => {
  switch (lane) {
    case 'LANE_A':
      return (
        <div className="inline-flex flex-col items-start gap-0.5">
          <Badge variant="red">LANE A — EMERGENCY</Badge>
          {showSubtitle && <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-tight">Manual Safety Procedure</span>}
        </div>
      );
    case 'LANE_B1':
      return (
        <div className="inline-flex flex-col items-start gap-0.5">
          <Badge variant="blue">LANE B1 — PLANNED</Badge>
          {showSubtitle && <span className="text-[10px] text-slate-500 uppercase tracking-tight">Optimizer Eligible</span>}
        </div>
      );
    case 'LANE_B2':
      return (
        <div className="inline-flex flex-col items-start gap-0.5">
          <Badge variant="amber">LANE B2 — STATUTORY DUE</Badge>
          {showSubtitle && <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-tight">Strict Deadline Priority</span>}
        </div>
      );
    default:
      return <Badge variant="slate">{lane}</Badge>;
  }
};
