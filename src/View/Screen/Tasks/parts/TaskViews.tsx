import React from 'react';
import type { TasksController } from '../useTasksController';
import { TaskList } from './TaskList';
import { TaskDashboard } from './TaskDashboard';
import { TemplateList } from './TemplateList';
import { TaskDetails } from './TaskDetails';
import { TaskForm } from './TaskForm';

/** The open tab's content on phones (the desktop page uses TaskBoard) */
export const TabContent: React.FC<{ c: TasksController; mobile: boolean }> = ({ c, mobile }) => (
  c.tab === 'dashboard' ? <TaskDashboard c={c} mobile={mobile} />
    : c.tab === 'templates' ? <TemplateList c={c} mobile={mobile} />
      : <TaskList key={c.tab} c={c} mobile={mobile} />
);

/** Details and forms over the page */
export const TaskOverlays: React.FC<{ c: TasksController; mobile: boolean }> = ({ c, mobile }) => (
  <>
    {c.details && <TaskDetails key={c.details.id} c={c} task={c.details} mobile={mobile} />}
    {c.form && <TaskForm c={c} task={c.form.task} template={c.form.template} kind={c.form.kind} kinds={c.form.kinds} mobile={mobile} />}
  </>
);
