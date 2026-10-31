import { Eye, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import type { ActionsMenuItem } from '../../../widget/ActionsMenu';
import { EVENT_META, isDated, ONCE_ICON, ONCE_LABEL, PERIODIC_ICON, SINGLE_ICON, SINGLE_LABEL, scheduleText, type TaskTemplate } from '../taskUtils';

/**
 * An appointment's kind, for its card (phones) and its row (computer): its icon, its name («مباراة», «دورية»,
 * «البرنامج», «موعد») and when it comes («كل أسبوع · الخميس», a date; nothing for an event, which comes with each one).
 */
export const appointmentKind = (t: TaskTemplate) => {
  const event = t.schedule === 'event';
  const single = t.schedule === 'single';
  if (event) {
    const meta = t.event_type ? EVENT_META[t.event_type] : null;
    return { event, icon: meta?.icon ?? PERIODIC_ICON, label: meta?.label ?? 'حدث', when: '' };
  }
  if (isDated(t.schedule)) {
    return { event, icon: single ? SINGLE_ICON : ONCE_ICON, label: single ? SINGLE_LABEL : ONCE_LABEL, when: scheduleText(t) };
  }
  return { event, icon: PERIODIC_ICON, label: 'دورية', when: scheduleText(t) };
};

/** What can be done with an appointment (only what this role may do is given) */
export interface AppointmentActions {
  onView?: (t: TaskTemplate) => void;
  onEdit?: (t: TaskTemplate) => void;
  onToggle?: (t: TaskTemplate) => void;
  onDelete?: (t: TaskTemplate) => void;
}

/** An appointment's ⋮: its details, then edit, stop / start, delete — those this role may do */
export const appointmentMenu = (
  t: TaskTemplate,
  { onView, onEdit, onToggle, onDelete }: AppointmentActions,
): ActionsMenuItem[] => {
  const on = t.status === 'active';
  return [
    ...(onView ? [{ key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#10b981', onClick: () => onView(t) }] : []),
    ...(onEdit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#3b82f6', onClick: () => onEdit(t) }] : []),
    ...(onToggle ? [{ key: 'toggle', label: on ? 'إيقاف' : 'تشغيل', icon: on ? PowerOff : Power, color: on ? '#f59e0b' : '#10b981', onClick: () => onToggle(t) }] : []),
    ...(onDelete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => onDelete(t) }] : []),
  ];
};
