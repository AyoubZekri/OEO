import React from 'react';
import type { TasksAdmin } from '../useTasks';
import type { TaskTemplate } from '../taskUtils';
import { TaskForm } from './TaskForm';
import { AppointmentDetails } from './AppointmentDetails';
import { DeleteConfirm } from '../../../shared/DeleteConfirm';

/** The appointments' details, new / edit form and delete prompt (computer and phone pages alike) */
export const TemplateOverlays: React.FC<{
  c: TasksAdmin;
  mobile: boolean;
  viewing: TaskTemplate | null;
  onViewClose: () => void;
  toDelete: TaskTemplate | null;
  onDeleteClose: () => void;
}> = ({ c, mobile, viewing, onViewClose, toDelete, onDeleteClose }) => (
  <>
    {viewing && <AppointmentDetails t={viewing} mobile={mobile} onClose={onViewClose} />}
    {c.form && <TaskForm c={c} template={c.form.template} appointment mobile={mobile} />}
    {toDelete && (
      <DeleteConfirm
        title="حذف الموعد؟"
        name={toDelete.title}
        onConfirm={() => c.remove(toDelete.id, true)}
        onClose={onDeleteClose}
      />
    )}
  </>
);
