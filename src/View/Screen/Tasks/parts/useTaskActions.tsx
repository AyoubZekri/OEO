import React, { useState } from 'react';
import type { TasksAdmin } from '../useTasks';
import type { Task } from '../taskUtils';
import { TaskForm } from './TaskForm';
import { VoiceTaskForm } from './VoiceTaskForm';
import { TaskChatDialog, TaskDetails, TaskStatusDialog } from './TaskDetails';
import { taskMenu } from './taskMenu';
import { DeleteConfirm } from './DeleteConfirm';

/**
 * A task's ⋮ menu and what it opens (computer and phone pages alike): the details, the conversation, the status,
 * the new / edit form (or the voice note's) and the delete prompt.
 */
export const useTaskActions = (c: TasksAdmin, mobile: boolean) => {
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const [statusId, setStatusId] = useState<number | null>(null);
  const chatTask = chatId ? c.tasks.find(t => t.id === chatId) : undefined;
  const statusTask = statusId ? c.tasks.find(t => t.id === statusId) : undefined;

  const menu = (t: Task) => taskMenu(t, {
    open: c.openTask,
    chat: x => setChatId(x.id),
    status: c.can('edit') ? x => setStatusId(x.id) : undefined,
    edit: c.can('edit') ? x => c.openForm({ task: x }) : undefined,
    remove: c.can('delete') ? setToDelete : undefined,
  });

  const overlays = (
    <>
      {c.opened && <TaskDetails task={c.opened} mobile={mobile} onClose={c.closeTask} />}
      {chatTask && <TaskChatDialog task={chatTask} mobile={mobile} onTask={c.replace} onClose={() => setChatId(null)} />}
      {statusTask && (
        <TaskStatusDialog
          task={statusTask}
          mobile={mobile}
          onSave={async (s, note) => { await c.setStatus(statusTask, s, note); }}
          onClose={() => setStatusId(null)}
        />
      )}
      {c.form && (c.form.voice
        ? <VoiceTaskForm c={c} task={c.form.task} mobile={mobile} />
        : <TaskForm c={c} task={c.form.task} mobile={mobile} />)}
      {toDelete && (
        <DeleteConfirm
          title="حذف المهمة؟"
          name={toDelete.title}
          note="تُحذف المهمة ومحادثتها نهائياً، ولا يمكن التراجع."
          onConfirm={() => c.remove(toDelete.id, false)}
          onClose={() => setToDelete(null)}
        />
      )}
    </>
  );

  return { menu, overlays };
};
