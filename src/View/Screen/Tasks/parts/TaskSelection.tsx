import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, Pencil, Trash2, X } from 'lucide-react';
import type { TaskSelection } from './useTaskSelection';
import { DeleteConfirm } from '../../../shared/DeleteConfirm';

/** What is selected, in the bar and the question: tasks (the home page) or appointments */
const WORDS = {
  tasks: { bar: 'تحديد المهام', one: 'المهمة المحددة', many: 'المهام المحددة' },
  appointments: { bar: 'تحديد المواعيد', one: 'الموعد المحدد', many: 'المواعيد المحددة' },
  sections: { bar: 'تحديد الأقسام', one: 'القسم المحدد', many: 'الأقسام المحددة' },
};

/** The bar while selecting: cancel, how many, select all shown, edit (one selected only), delete (asked first) */
export const TaskSelectionBar: React.FC<{
  s: TaskSelection;
  tasks: { id: number }[];
  mobile: boolean;
  /** Deleting them (with the right to delete) */
  onDelete?: (ids: number[]) => Promise<void>;
  /** Editing it, when only one is selected (the same form as its ⋮'s «تعديل») */
  onEdit?: (id: number) => void;
  of?: keyof typeof WORDS;
}> = ({ s, tasks, mobile, onDelete, onEdit, of = 'tasks' }) => {
  const words = WORDS[of];
  const [asking, setAsking] = useState(false);
  if (!s.active) return null;
  // Only what is shown (a filter may have hidden some)
  const picked = tasks.filter(s.picked).map(t => t.id);
  const all = picked.length === tasks.length;

  return createPortal(
    <>
      <div className={`tsk-selbar ${mobile ? 'mobile' : ''}`} role="toolbar" aria-label={words.bar}>
        <button type="button" className="tsk-selbar-x" onClick={s.clear} aria-label="إلغاء التحديد"><X size={18} /></button>
        <span className="tsk-selbar-count" aria-label={`${picked.length} محددة`}><b>{picked.length}</b><span>محددة</span></span>
        <button type="button" className="tsk-selbar-all" aria-label={all ? 'إلغاء الكل' : 'تحديد الكل'} title={all ? 'إلغاء الكل' : 'تحديد الكل'} onClick={() => s.set(new Set(all ? [] : tasks.map(t => t.id)))}>
          <CheckCheck size={16} /><span>{all ? 'إلغاء الكل' : 'تحديد الكل'}</span>
        </button>
        {onEdit && picked.length === 1 && (
          <button type="button" className="tsk-selbar-edit" aria-label="تعديل" title="تعديل" onClick={() => { const id = picked[0]; s.clear(); onEdit(id); }}>
            <Pencil size={16} /><span>تعديل</span>
          </button>
        )}
        {onDelete && <button type="button" className="tsk-selbar-del" disabled={!picked.length} onClick={() => setAsking(true)}><Trash2 size={16} /><span>حذف</span></button>}
      </div>
      {asking && onDelete && (
        <DeleteConfirm
          title={`حذف ${picked.length === 1 ? words.one : `${words.many} (${picked.length})`}؟`}
          onConfirm={async () => { await onDelete(picked); s.clear(); }}
          onClose={() => setAsking(false)}
        />
      )}
    </>,
    document.body,
  );
};
