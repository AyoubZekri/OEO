import React, { useState } from 'react';
import { Plus, ClipboardList, Inbox, RefreshCw, AlarmClock, Zap, CheckCircle2, Mic } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { PageLoader } from '../../shared/PageLoader';
import { MobileTasks } from '../../Mobile/MobileTasks/MobileTasks';
import { useTasksAdmin } from './useTasks';
import { TaskTable } from './parts/TaskTable';
import { useTaskActions } from './parts/useTaskActions';
import { countTasks, filterTasks, KIND_FILTERS, NATURE_FILTERS, sortTasks, STATUS_FILTERS } from './taskUtils';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Tasks.css';

/**
 * The tasks page, its tasks tab: every task given to the members (tabs: the tasks / the appointments).
 * Computer: the figures, the filters, then a table. Phones: MobileTasks.
 */
export const Tasks: React.FC<{ tabs?: React.ReactNode }> = ({ tabs }) => {
  const c = useTasksAdmin('tasks');
  const isMobile = useIsMobile();
  const [status, setStatus] = useState('open');
  const [query, setQuery] = useState('');
  const [nature, setNature] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { menu, overlays } = useTaskActions(c, isMobile);

  if (isMobile) return <MobileTasks c={c} tabs={tabs} />;

  const n = countTasks(c.tasks);
  const visible = sortTasks(filterTasks(c.tasks, status, query, nature, kind));
  const statusCount = (value: string) => c.tasks.filter(STATUS_FILTERS.find(f => f.value === value)!.test).length;
  const kindCount = (value: string) => c.tasks.filter(t => !value || t.kind === value).length;

  const content = c.loading && !c.tasks.length ? <PageLoader mobile={false} text="جاري تحميل المهام..." />
    : c.error ? (
      <div className="tk-state">
        <ClipboardList size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : visible.length === 0 ? <div className="tk-state"><Inbox size={30} /><p>{c.tasks.length ? 'لا توجد مهام بهذه التصفية' : 'لا توجد مهام'}</p></div>
      : (
        <div className="table-pagination-wrapper">
          <ItemsPerPageSelector itemsPerPage={perPage} onItemsPerPageChange={setPerPage} onPageChange={setPage} />
          <TaskTable tasks={visible.slice((page - 1) * perPage, page * perPage)} onOpen={c.openTask} menu={menu} />
          <Pagination totalItems={visible.length} itemsPerPage={perPage} currentPage={page} onPageChange={setPage} onItemsPerPageChange={setPerPage} />
        </div>
      );

  const figures = [
    { label: 'غير منجزة', v: n.open, icon: ClipboardList, tone: 'blue' },
    { label: 'عاجلة', v: n.urgent, icon: Zap, tone: 'red' },
    { label: 'متأخرة', v: n.overdue, icon: AlarmClock, tone: 'amber' },
    { label: 'منجزة', v: n.done, icon: CheckCircle2, tone: 'green' },
  ];

  return (
    <div className="tk-page tk-scope">
      <div className="db-stats">
        {figures.map(s => (
          <div key={s.label} className={`tone-${s.tone}`}>
            <span className="db-stat-icon"><s.icon size={22} /></span>
            <span className="db-stat-text">
              <small>{s.label}</small>
              <b>{s.v}</b>
            </span>
          </div>
        ))}
      </div>

      <div className="tk-actions-row">
        <TopbarSearch value={query} onChange={v => { setQuery(v); setPage(1); }} placeholder="بحث بالمهمة أو المكلّف..." />
        <CustomDropdown
          options={STATUS_FILTERS.map(f => ({ value: f.value || 'all', label: `${f.label} (${statusCount(f.value)})` }))}
          value={status || 'all'}
          onChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}
        />
        <CustomDropdown
          options={KIND_FILTERS.map(f => ({ value: f.value || 'all', label: `${f.label} (${kindCount(f.value)})` }))}
          value={kind || 'all'}
          onChange={v => { setKind(v === 'all' ? '' : v); setPage(1); }}
        />
        <CustomDropdown
          options={NATURE_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
          value={nature || 'all'}
          onChange={v => { setNature(v === 'all' ? '' : v); setPage(1); }}
        />
        {c.can('add') && <button type="button" className="btn-primary tsk-voice-add" onClick={() => c.openForm({ voice: true })}><Mic size={18} />تنبيه صوتي</button>}
        {c.can('add') && <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />مهمة جديدة</button>}
      </div>

      {tabs}

      {content}
      {overlays}
    </div>
  );
};
