import React from 'react';
import { Plus } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileTasks } from '../../Mobile/MobileTasks/MobileTasks';
import { useTasksController } from './useTasksController';
import { TaskOverlays } from './parts/TaskViews';
import { TaskBoard } from './parts/TaskBoard';
import './Tasks.css';

// Tasks: my tasks, tasks to review, tasks I created, and for managers every task, the dashboard and automatic tasks
export const Tasks: React.FC = () => {
  const c = useTasksController();
  const isMobile = useIsMobile();

  if (isMobile) return <MobileTasks c={c} />;

  const addButton = c.tab === 'templates'
    ? <button type="button" className="btn-primary" onClick={() => c.openTemplateForm()}><Plus size={18} />مهمة تلقائية</button>
    : c.isList && c.tab !== 'archive' && (c.can('add') || c.can('templates'))
      ? <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />مهمة جديدة</button>
      : null;

  return (
    <div className="tk-page tk-scope">
      <TaskBoard c={c} addButton={addButton} />
      <TaskOverlays c={c} mobile={false} />
    </div>
  );
};
