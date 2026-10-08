import type React from 'react';
import { AlertTriangle, Bell, Gavel, ShieldCheck } from 'lucide-react';
import type { DecisionKind } from '../decision';

/** The icon of each kind of decision */
export const DECISION_ICONS: Record<DecisionKind, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  none: ShieldCheck,
  'تنبيه': Bell,
  'إنذار': AlertTriangle,
  other: Gavel,
};
