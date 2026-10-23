import React from 'react';
import type { TasksAdmin } from '../useTasks';
import type { TaskTemplate } from '../taskUtils';
import { TaskForm } from './TaskForm';
import { DeleteConfirm } from './DeleteConfirm';

/** The appointments' new / edit form and delete prompt (computer and phone pages alike) */
export const TemplateOverlays: React.FC<{ c: TasksAdmin; mobile: boolean; toDelete: TaskTemplate | null; onDeleteClose: () => void }> = ({ c, mobile, toDelete, onDeleteClose }) => (
  <>
    {c.form && <TaskForm c={c} template={c.form.template} appointment mobile={mobile} />}
    {toDelete && (
      <DeleteConfirm
        title="حذف الموعد؟"
        name={toDelete.title}
        note="لن يُنشئ مهاماً جديدة بعد الآن، والمهام التي أنشأها تبقى."
        onConfirm={() => c.remove(toDelete.id, true)}
        onClose={onDeleteClose}
      />
    )}
  </>
);
