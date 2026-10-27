import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, Trash2, X } from 'lucide-react';
import type { Task } from '../taskUtils';
import type { TaskSelection } from './useTaskSelection';
import { DeleteConfirm } from './DeleteConfirm';

/** The bar while selecting: cancel, how many, select all shown, delete (asked first) */
export const TaskSelectionBar: React.FC<{ s: TaskSelection; tasks: Task[]; mobile: boolean; onDelete: (ids: number[]) => Promise<void> }> = ({ s, tasks, mobile, onDelete }) => {
  const [asking, setAsking] = useState(false);
  if (!s.active) return null;
  // Only what is shown (a filter may have hidden some)
  const picked = tasks.filter(s.picked).map(t => t.id);
  const all = picked.length === tasks.length;

  return createPortal(
    <>
      <div className={`tsk-selbar ${mobile ? 'mobile' : ''}`} role="toolbar" aria-label="تحديد المهام">
        <button type="button" className="tsk-selbar-x" onClick={s.clear} aria-label="إلغاء التحديد"><X size={18} /></button>
        <span className="tsk-selbar-count"><b>{picked.length}</b><span>محددة</span></span>
        <button type="button" className="tsk-selbar-all" onClick={() => s.set(new Set(all ? [] : tasks.map(t => t.id)))}>
          <CheckCheck size={16} /><span>{all ? 'إلغاء الكل' : 'تحديد الكل'}</span>
        </button>
        <button type="button" className="tsk-selbar-del" disabled={!picked.length} onClick={() => setAsking(true)}><Trash2 size={16} /><span>حذف</span></button>
      </div>
      {asking && (
        <DeleteConfirm
          title={`حذف ${picked.length === 1 ? 'المهمة المحددة' : `المهام المحددة (${picked.length})`}؟`}
          note="تُحذف المهام ومحادثاتها نهائياً، ولا يمكن التراجع."
          onConfirm={async () => { await onDelete(picked); s.clear(); }}
          onClose={() => setAsking(false)}
        />
      )}
    </>,
    document.body,
  );
};
