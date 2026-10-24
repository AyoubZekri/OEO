import { Eye, MessagesSquare, ArrowLeftRight, Pencil, Trash2, ExternalLink } from 'lucide-react';
import type { ActionsMenuItem } from '../../../widget/ActionsMenu';
import { EVENT_LINK, type Task } from '../taskUtils';

/**
 * A task's ⋮ menu (computer table and phone list): its details, its event (an appointment's task), the conversation
 * (with its new messages), and for the management: its status, edit, delete.
 */
export const taskMenu = (t: Task, h: {
  open: (t: Task) => void;
  event?: (t: Task) => void;
  chat?: (t: Task) => void;
  status?: (t: Task) => void;
  edit?: (t: Task) => void;
  remove?: (t: Task) => void;
}): ActionsMenuItem[] => [
  { key: 'open', label: 'عرض التفاصيل', icon: Eye, color: '#3b82f6', onClick: () => h.open(t) },
  ...(h.event && t.event ? [{ key: 'event', label: EVENT_LINK[t.event.type].open, icon: ExternalLink, color: '#f97316', onClick: () => h.event!(t) }] : []),
  ...(h.chat ? [{ key: 'chat', label: t.unread > 0 ? `المحادثة (${t.unread} جديدة)` : 'المحادثة', icon: MessagesSquare, color: '#f97316', onClick: () => h.chat!(t) }] : []),
  ...(h.status ? [{ key: 'status', label: 'تغيير الحالة', icon: ArrowLeftRight, color: '#f59e0b', onClick: () => h.status!(t) }] : []),
  ...(h.edit ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#10b981', onClick: () => h.edit!(t) }] : []),
  ...(h.remove ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => h.remove!(t) }] : []),
];
