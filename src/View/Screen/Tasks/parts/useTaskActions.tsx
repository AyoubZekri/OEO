import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TasksAdmin } from '../useTasks';
import { eventLink, type Task } from '../taskUtils';
import { TaskForm } from './TaskForm';
import { VoiceTaskForm } from './VoiceTaskForm';
import { TaskChatDialog, TaskDetails, TaskStatusDialog } from './TaskDetails';
import { taskMenu } from './taskMenu';
import { DeleteConfirm } from '../../../shared/DeleteConfirm';

/**
 * A task's ⋮ menu and what it opens (computer and phone pages alike): the details, its event's page, the status,
 * the new / edit form (or the voice note's) and the delete prompt. The conversation has its own button on the row,
 * so it is not in the menu. withSelection: the page edits and deletes through its selection bar (hold a row), so
 * «تعديل» and «حذف» leave the menu too.
 */
export const useTaskActions = (c: TasksAdmin, mobile: boolean, withSelection = false) => {
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const [statusId, setStatusId] = useState<number | null>(null);
  const chatTask = chatId ? c.tasks.find(t => t.id === chatId) : undefined;
  const statusTask = statusId ? c.tasks.find(t => t.id === statusId) : undefined;

  const menu = (t: Task) => taskMenu(t, {
    open: c.openTask,
    event: x => { if (x.event) navigate(eventLink(x.event)); },
    status: c.can('changeStatus') ? x => setStatusId(x.id) : undefined,
    edit: !withSelection && c.can('edit') ? x => c.openForm({ task: x }) : undefined,
    remove: !withSelection && c.can('delete') ? setToDelete : undefined,
  });

  const overlays = (
    <>
      {c.opened && <TaskDetails task={c.opened} mobile={mobile} onClose={c.closeTask} withEvent onChat={c.can('chat') ? () => setChatId(c.opened!.id) : undefined} />}
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
          onConfirm={() => c.remove(toDelete.id, false)}
          onClose={() => setToDelete(null)}
        />
      )}
    </>
  );

  // The conversation, opened from its own button on a card / row
  const chat = c.can('chat') ? (t: Task) => setChatId(t.id) : undefined;

  return { menu, overlays, chat };
};
