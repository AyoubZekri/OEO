import React, { useState } from 'react';
import { Plus, ClipboardList, Inbox, RefreshCw, AlarmClock, Zap, PlayCircle, Mic } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { PageLoader } from '../../shared/PageLoader';
import type { TasksAdmin } from '../../Screen/Tasks/useTasks';
import { useTaskActions } from '../../Screen/Tasks/parts/useTaskActions';
import { countTasks, filterTasks, sortTasks } from '../../Screen/Tasks/taskUtils';
import { MobileTaskRow } from './MobileTaskRow';
import { MobileTaskFilters, type TaskFilterState } from './MobileTaskFilters';
import '../../shared/kit.css';
import '../../Screen/Travels/Travels.css';
import '../../Screen/Debts/Debts.css';
import '../../Screen/Tasks/Tasks.css';
import './MobileTasks.css';

// Phone version of the tasks page, its tasks tab: the figures in the hero, the tabs, search and three filters
// (status, kind, nature), the list, and the two floating buttons (voice note, new task)
export const MobileTasks: React.FC<{ c: TasksAdmin; tabs?: React.ReactNode }> = ({ c, tabs }) => {
  const [filters, setFilters] = useState<TaskFilterState>({ query: '', status: 'open', kind: '', nature: '' });
  const { menu, overlays } = useTaskActions(c, true);

  const n = countTasks(c.tasks);
  const visible = sortTasks(filterTasks(c.tasks, filters.status, filters.query, filters.nature, filters.kind));

  const figures = [
    { label: 'غير منجزة', v: n.open, icon: ClipboardList, tone: 'blue' },
    { label: 'عاجلة', v: n.urgent, icon: Zap, tone: 'red' },
    { label: 'متأخرة', v: n.overdue, icon: AlarmClock, tone: 'amber' },
    { label: 'قيد التنفيذ', v: n.progress, icon: PlayCircle, tone: 'orange' },
  ];

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="المهام" />

      <section className="tk-hero">
        <div className="tk-hero-tiles tsk-hero-tiles">
          {figures.map(t => (
            <div key={t.label} className={`tone-${t.tone}`}>
              <t.icon size={14} />
              <strong>{t.v}</strong>
              <small>{t.label}</small>
            </div>
          ))}
        </div>
      </section>

      {tabs}

      <MobileTaskFilters tasks={c.tasks} value={filters} onChange={setFilters} />

      {c.loading && !c.tasks.length ? <PageLoader mobile text="جاري تحميل المهام..." />
        : c.error ? (
          <div className="tk-state">
            <ClipboardList size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? <div className="tk-state"><Inbox size={30} /><p>{c.tasks.length ? 'لا توجد مهام بهذه التصفية' : 'لا توجد مهام'}</p></div>
          : <div className="tsk-mlist">{visible.map(t => <MobileTaskRow key={t.id} task={t} onOpen={c.openTask} menu={menu(t)} />)}</div>}

      {c.can('add') && (
        <>
          <button type="button" className="tk-fab tsk-fab-voice" onClick={() => c.openForm({ voice: true })} aria-label="تنبيه صوتي">
            <Mic size={22} strokeWidth={2.5} />
          </button>
          <button type="button" className="tk-fab" onClick={() => c.openForm()} aria-label="مهمة جديدة">
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </>
      )}

      {overlays}
    </div>
  );
};
