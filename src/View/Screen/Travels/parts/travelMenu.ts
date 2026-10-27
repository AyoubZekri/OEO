import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { ActionsMenuItem } from '../../../widget/ActionsMenu';
import type { TravelsController } from '../useTravelsController';
import type { Travel } from '../travelUtils';

/** A trip's ⋮ menu (computer cards and phone list): its details, and for who may: edit, delete */
export const travelMenu = (t: Travel, c: TravelsController): ActionsMenuItem[] => [
  { key: 'open', label: 'عرض التفاصيل', icon: Eye, color: '#3b82f6', onClick: () => c.openTravel(t) },
  ...(c.can('edit') ? [{ key: 'edit', label: 'تعديل', icon: Pencil, color: '#10b981', onClick: () => c.openForm(t) }] : []),
  ...(c.can('delete') ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => c.askDelete(t) }] : []),
];
