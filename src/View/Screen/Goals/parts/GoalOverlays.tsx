import React from 'react';
import type { GoalsController } from '../useGoals';
import { DeleteConfirm } from '../../../shared/DeleteConfirm';
import { GoalForm } from './GoalForm';
import { GoalDetails } from './GoalDetails';

/** The goal's details, its form and the delete prompt over the page (both layouts) */
export const GoalOverlays: React.FC<{ c: GoalsController; mobile: boolean }> = ({ c, mobile }) => (
  <>
    {c.viewing && <GoalDetails c={c} goal={c.viewing} mobile={mobile} />}
    {c.form && <GoalForm key={c.form.goal?.id ?? 'new'} c={c} goal={c.form.goal} mobile={mobile} />}
    {c.deleting && (
      <DeleteConfirm
        title="حذف الهدف؟"
        name={c.deleting.goal}
        onConfirm={() => c.remove(c.deleting!)}
        onClose={c.closeDelete}
      />
    )}
  </>
);
