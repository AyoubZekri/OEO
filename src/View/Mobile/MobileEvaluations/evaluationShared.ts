import type React from 'react';
import { ShieldCheck, Activity, Trophy, Brain, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import type { EvaluationRecord } from '../../Screen/Members/Evaluation/evaluation_data';

export type Grade = 'excellent' | 'good' | 'acceptable' | 'weak';

// Same thresholds as the evaluation form and the desktop evaluation report
export const gradeOf = (percent: number): Grade =>
  percent >= 85 ? 'excellent' : percent >= 70 ? 'good' : percent >= 55 ? 'acceptable' : 'weak';

export const GRADE_LABELS: Record<Grade, string> = {
  excellent: 'ممتاز',
  good: 'جيد',
  acceptable: 'مقبول',
  weak: 'ضعيف',
};

export const CRITERIA: { key: keyof EvaluationRecord['scores']; label: string; short: string; max: number; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'discipline', label: 'الانضباط والحضور', short: 'الانضباط', max: 10, icon: ShieldCheck },
  { key: 'physical', label: 'الجاهزية البدنية', short: 'البدني', max: 15, icon: Activity },
  { key: 'technical', label: 'المستوى الفني', short: 'الفني', max: 20, icon: Trophy },
  { key: 'tactical', label: 'الأداء التكتيكي', short: 'التكتيكي', max: 15, icon: Brain },
  { key: 'matchOutput', label: 'المردودية في المباريات', short: 'المردودية', max: 20, icon: TrendingUp },
  { key: 'instructions', label: 'تنفيذ تعليمات الطاقم الفني', short: 'التعليمات', max: 10, icon: Target },
  { key: 'behavior', label: 'السلوك وروح المجموعة', short: 'السلوك', max: 10, icon: CheckCircle2 },
];
