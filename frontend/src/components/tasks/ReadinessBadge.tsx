import React from 'react';
import { Badge } from '../common/Badge';
import { ReadinessLevel } from '../../types';

interface ReadinessBadgeProps {
  level: ReadinessLevel | string;
}

export const ReadinessBadge: React.FC<ReadinessBadgeProps> = ({ level }) => {
  const norm = level?.toUpperCase();
  if (norm === 'HIGH') return <Badge variant="green">READINESS: HIGH</Badge>;
  if (norm === 'MEDIUM') return <Badge variant="amber">READINESS: MEDIUM</Badge>;
  if (norm === 'LOW') return <Badge variant="red">READINESS: LOW</Badge>;
  return <Badge variant="slate">{level || 'PENDING'}</Badge>;
};
