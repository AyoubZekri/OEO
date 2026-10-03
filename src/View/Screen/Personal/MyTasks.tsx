import React from 'react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileTasks } from '../../Mobile/MobileTasks/MobileTasks';
import { useTasksController } from '../Tasks/useTasksController';
import { TaskBoard } from '../Tasks/parts/TaskBoard';
import { TaskOverlays } from '../Tasks/parts/TaskViews';
import '../Tasks/Tasks.css';

/**
 * Personal space: the tasks assigned to the signed-in user, read only.
 * They are seen, not edited or deleted, and their status is not changed here; a proof is added when the task asks for one.
 */
export const MyTasks: React.FC = () => {
  const c = useTasksController('personal');
  const isMobile = useIsMobile();

  if (isMobile) return <MobileTasks c={c} title="مهامي" />;

  return (
    <div className="tk-page tk-scope">
      <TaskBoard c={c} addButton={null} />
      <TaskOverlays c={c} mobile={false} />
    </div>
  );
};
