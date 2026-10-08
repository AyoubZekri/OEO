import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Lock, Loader2 } from 'lucide-react';
import { MobileSheet } from '../../../Mobile/widgets/MobileSheet';
import { ACTION_META, STATUS_META, type Task, type TaskAction, type TaskStatus } from '../taskUtils';

const ORDER: TaskStatus[] = ['assigned', 'in_progress', 'blocked', 'in_review', 'approved', 'returned'];

/**
 * Which workflow action moves the task to a status, if the signed-in user may take it now:
 * the stage's own action (forward or back a step), else "set" for who manages the tasks (any status at once)
 */
const actionTo = (task: Task, status: TaskStatus, allowed: TaskAction[]): TaskAction | null => {
  const candidates: Record<TaskStatus, TaskAction[]> = {
    assigned: ['reset'],
    in_progress: ['start', 'resume', 'withdraw', 'reopen'],
    blocked: ['block'],
    in_review: task.requires_approval ? ['submit'] : [],
    approved: task.requires_approval ? ['approve'] : ['submit'],
    returned: ['return'],
  };
  return candidates[status].find(a => allowed.includes(a)) || (allowed.includes('set') ? 'set' : null);
};

/** Why a status cannot be chosen: said once under the list */
const lockedHint = (task: Task, allowed: TaskAction[]) => {
  if (task.deleted_at) return 'المهمة محذوفة';
  if (allowed.length === 0) {
    if (task.status === 'approved') return 'المهمة منجزة';
    if (task.status === 'in_review') return 'الاعتماد أو الإرجاع لمن له صلاحية المراجعة';
    return 'لا يمكن تغيير الحالة الآن';
  }
  return 'الحالات الأخرى غير متاحة في هذه المرحلة';
};

interface StatusDropdownProps {
  task: Task;
  allowed: TaskAction[];
  busy: boolean;
  mobile: boolean;
  /** The action, and the status chosen (used by "set") */
  onPick: (action: TaskAction, status: TaskStatus) => void;
}

/** The current status as a dropdown: the statuses the user may move the task to are enabled, the others greyed out */
export const StatusDropdown: React.FC<StatusDropdownProps> = ({ task, allowed, busy, mobile, onPick }) => {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[task.status];
  const canChange = allowed.length > 0 && !task.deleted_at;

  useEffect(() => {
    if (!open || mobile) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open, mobile]);

  const pick = (action: TaskAction, status: TaskStatus) => {
    setOpen(false);
    onPick(action, status);
  };

  const options = (
    <>
      <ul className="tk-status-list" role="listbox" aria-label="حالة المهمة">
        {ORDER.map(s => {
          const m = STATUS_META[s];
          const current = s === task.status;
          const action = current ? null : actionTo(task, s, allowed);
          const label = s === 'approved' && action === 'submit' ? 'تم الإنجاز' : action ? ACTION_META[action].label : null;
          return (
            <li key={s}>
              <button
                type="button"
                role="option"
                aria-selected={current}
                className={`tone-${m.tone} ${current ? 'current' : ''}`}
                disabled={!action}
                onClick={() => action && pick(action, s)}
              >
                <span className="tk-status-dot" aria-hidden="true"><m.icon size={15} /></span>
                <span className="tk-status-text">
                  <strong>{m.label}</strong>
                  {current ? <small>الحالة الحالية</small> : label && <small>{label}</small>}
                </span>
                {current ? <Check size={16} /> : !action && <Lock size={13} className="tk-status-lock" />}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="tk-status-hint"><Lock size={12} />{lockedHint(task, allowed)}</p>
    </>
  );

  return (
    <div className={`tk-status-dd tone-${meta.tone}`} ref={box}>
      <button
        type="button"
        className={`tk-status-trigger ${canChange ? '' : 'locked'}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={busy}
      >
        <span className="tk-status-dot" aria-hidden="true">{busy ? <Loader2 size={15} className="tk-spin" /> : <meta.icon size={15} />}</span>
        <span className="tk-status-text">
          <small>الحالة</small>
          <strong>{meta.label}</strong>
        </span>
        {canChange ? <ChevronDown size={17} className="tk-status-chevron" /> : <Lock size={14} />}
      </button>

      {open && (mobile ? (
        <MobileSheet title="تغيير حالة المهمة" onClose={() => setOpen(false)}>
          <div className="tk-scope">{options}</div>
        </MobileSheet>
      ) : (
        <div className="tk-status-menu">{options}</div>
      ))}
    </div>
  );
};

/** Progress through the stages: new → in progress → in review → done (blocked / returned shown on the working step) */
export const TaskStepper: React.FC<{ task: Task }> = ({ task }) => {
  const steps: { key: TaskStatus; label: string }[] = [
    { key: 'assigned', label: 'جديدة' },
    { key: 'in_progress', label: 'التنفيذ' },
    ...(task.requires_approval ? [{ key: 'in_review' as const, label: 'المراجعة' }] : []),
    { key: 'approved', label: 'منجزة' },
  ];
  const at = task.status === 'blocked' || task.status === 'returned' ? 'in_progress' : task.status;
  const index = Math.max(0, steps.findIndex(s => s.key === at));
  const flag = task.status === 'blocked' ? 'معطلة' : task.status === 'returned' ? 'مُرجعة للتصحيح' : null;

  return (
    <ol className="tk-stepper" aria-label="مراحل المهمة">
      {steps.map((s, i) => {
        const state = i < index || task.status === 'approved' ? 'done' : i === index ? 'now' : 'next';
        return (
          <li key={s.key} className={`${state} ${state === 'now' && flag ? (task.status === 'blocked' ? 'tone-red' : 'tone-amber') : ''}`}>
            <span className="tk-step-dot" aria-hidden="true">{state === 'done' ? <Check size={13} /> : i + 1}</span>
            <span className="tk-step-label">{state === 'now' && flag ? flag : s.label}</span>
          </li>
        );
      })}
    </ol>
  );
};
