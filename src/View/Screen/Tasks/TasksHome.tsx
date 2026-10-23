import React, { useState } from 'react';
import { ListTodo, CalendarClock } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { Tasks } from './Tasks';
import { Appointments } from './Appointments';

type Tab = 'tasks' | 'templates';
const TAB_KEY = 'tasksHomeTab';

/** The tasks page: the tasks and the appointments, switched by two tabs (the whole page's width) */
export const TasksHome: React.FC = () => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>(() => {
    // Opened on a task (from an alert): the tasks tab
    if (new URLSearchParams(window.location.search).has('task')) return 'tasks';
    try { return sessionStorage.getItem(TAB_KEY) === 'templates' ? 'templates' : 'tasks'; } catch { return 'tasks'; }
  });
  const pick = (next: Tab) => {
    setTab(next);
    try { sessionStorage.setItem(TAB_KEY, next); } catch { /* only not remembered */ }
  };

  const tabs = (
    <div className={`${isMobile ? 'tk-mtabs' : 'tk-tabs'} tsk-tabs`} role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'tasks'} className={tab === 'tasks' ? 'on' : ''} onClick={() => pick('tasks')}>
        <ListTodo size={16} />المهام
      </button>
      <button type="button" role="tab" aria-selected={tab === 'templates'} className={tab === 'templates' ? 'on' : ''} onClick={() => pick('templates')}>
        <CalendarClock size={16} />المواعيد
      </button>
    </div>
  );

  return tab === 'tasks' ? <Tasks tabs={tabs} /> : <Appointments tabs={tabs} />;
};
