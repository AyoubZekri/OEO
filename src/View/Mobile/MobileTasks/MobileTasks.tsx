import React from 'react';
import { Plus, ListTodo, CalendarCheck, AlarmClock, Undo2, PauseCircle, CheckCircle2 } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import type { TasksController } from '../../Screen/Tasks/useTasksController';
import { TabContent, TaskOverlays } from '../../Screen/Tasks/parts/TaskViews';
import { countTasks } from '../../Screen/Tasks/taskUtils';
import '../../Screen/Tasks/Tasks.css';

// Phone version of the tasks page: my counters in the hero, scrollable tabs, cards and a floating add button
export const MobileTasks: React.FC<{ c: TasksController }> = ({ c }) => {
  const n = countTasks(c.tab === 'tasks' ? c.tasks : []);
  const canAdd = c.tab === 'templates' || (c.isList && c.tab !== 'archive' && (c.can('add') || c.can('templates')));

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="المهام" />

      {c.tab === 'tasks' && (
        <section className="tk-hero">
          <div className="tk-hero-top">
            <span className="tk-hero-icon"><ListTodo size={26} /></span>
            <div>
              <small>المهام المفتوحة</small>
              <strong>{n.open}</strong>
            </div>
          </div>
          <div className="tk-hero-tiles">
            {[
              { label: 'اليوم', v: n.today, icon: CalendarCheck, tone: 'blue' },
              { label: 'متأخرة', v: n.overdue, icon: AlarmClock, tone: 'red' },
              { label: 'مُرجعة', v: n.returned, icon: Undo2, tone: 'amber' },
              { label: 'معطلة', v: n.blocked, icon: PauseCircle, tone: 'red' },
              { label: 'منجزة', v: n.approved, icon: CheckCircle2, tone: 'green' },
            ].map(t => (
              <div key={t.label} className={`tone-${t.tone}`}>
                <t.icon size={14} />
                <strong>{t.v}</strong>
                <small>{t.label}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      <TabContent c={c} mobile />

      {canAdd && (
        <button
          type="button"
          className="tk-fab"
          onClick={() => (c.tab === 'templates' ? c.openTemplateForm() : c.openForm())}
          aria-label={c.tab === 'templates' ? 'مهمة تلقائية جديدة' : 'مهمة جديدة'}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <TaskOverlays c={c} mobile />
    </div>
  );
};
