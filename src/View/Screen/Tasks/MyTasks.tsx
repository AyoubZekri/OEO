import React, { useState } from 'react';
import { ClipboardList, Inbox, RefreshCw, AlarmClock, Sparkles, CheckCircle2, Search, X, Filter, ChevronDown, Shapes, Layers } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { MobileSelect } from '../../Mobile/widgets/MobileSelect';
import { PageLoader } from '../../shared/PageLoader';
import { useMyTasks } from './useTasks';
import { MobileTaskRow } from '../../Mobile/MobileTasks/MobileTaskRow';
import { TaskTable } from './parts/TaskTable';
import { TaskChatDialog, TaskDetails } from './parts/TaskDetails';
import { taskMenu } from './parts/taskMenu';
import { countTasks, filterTasks, KIND_FILTERS, NATURE_FILTERS, sortTasks, STATUS_FILTERS, type Task } from './taskUtils';
import '../../shared/kit.css';
import '../Debts/Debts.css';
import './Tasks.css';

/** Personal space: the tasks given to me — I follow their status and talk about each one */
export const MyTasks: React.FC = () => {
  const c = useMyTasks();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState('open');
  const [query, setQuery] = useState('');
  const [nature, setNature] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [chatId, setChatId] = useState<number | null>(null);
  const chatTask = chatId ? c.tasks.find(t => t.id === chatId) : undefined;
  // Mine: the details and the conversation
  const menu = (t: Task) => taskMenu(t, { open: c.openTask, chat: x => setChatId(x.id) });

  const n = countTasks(c.tasks);
  const fresh = c.tasks.filter(t => !t.seen).length;
  const visible = sortTasks(filterTasks(c.tasks, status, query, nature, kind));
  const statusCount = (value: string) => c.tasks.filter(STATUS_FILTERS.find(f => f.value === value)!.test).length;

  const content = c.loading && !c.tasks.length ? <PageLoader mobile={isMobile} text="جاري تحميل مهامي..." />
    : c.error ? (
      <div className="tk-state">
        <ClipboardList size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : visible.length === 0 ? (
      <div className="tk-state"><Inbox size={30} /><p>{c.tasks.length ? 'لا توجد مهام بهذه التصفية' : 'لا توجد مهام'}</p></div>
    ) : isMobile ? (
      <div className="tsk-mlist">{visible.map(t => <MobileTaskRow key={t.id} task={t} onOpen={c.openTask} mine menu={menu(t)} />)}</div>
    ) : (
      <div className="table-pagination-wrapper">
        <ItemsPerPageSelector itemsPerPage={perPage} onItemsPerPageChange={setPerPage} onPageChange={setPage} />
        <TaskTable tasks={visible.slice((page - 1) * perPage, page * perPage)} onOpen={c.openTask} mine menu={menu} />
        <Pagination totalItems={visible.length} itemsPerPage={perPage} currentPage={page} onPageChange={setPage} onItemsPerPageChange={setPerPage} />
      </div>
    );

  const details = (
    <>
      {c.opened && <TaskDetails task={c.opened} mobile={isMobile} onClose={c.closeTask} />}
      {chatTask && <TaskChatDialog task={chatTask} mobile={isMobile} onTask={c.replace} onClose={() => setChatId(null)} />}
    </>
  );
  const figures = [
    { label: 'غير منجزة', v: n.open, icon: ClipboardList, tone: 'blue' },
    { label: 'جديدة', v: fresh, icon: Sparkles, tone: 'orange' },
    { label: 'متأخرة', v: n.overdue, icon: AlarmClock, tone: 'red' },
    { label: 'منجزة', v: n.done, icon: CheckCircle2, tone: 'green' },
  ];

  if (isMobile) {
    return (
      <div className="tk-mpage tk-scope">
        <MobileAppBar title="مهامي" />

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

        <div className="tk-toolbar">
          <label className="tk-search">
            <Search size={17} />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث..." />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
          </label>
          <div className="tk-mfilters tsk-mfilters3">
          <MobileSelect
            label="الحالة"
            icon={Filter}
            value={status || 'all'}
            options={STATUS_FILTERS.map(f => ({ value: f.value || 'all', label: f.label, hint: String(statusCount(f.value)) }))}
            onChange={v => setStatus(v === 'all' ? '' : v)}
            renderTrigger={open => (
              <button type="button" className={`tk-filter-btn ${status ? 'active' : ''}`} onClick={open}>
                <Filter size={15} />
                <span><small>الحالة</small><strong>{STATUS_FILTERS.find(f => f.value === status)?.label}</strong></span>
                <ChevronDown size={15} />
              </button>
            )}
          />
          <MobileSelect
            label="النوع"
            icon={Layers}
            value={kind || 'all'}
            options={KIND_FILTERS.map(f => ({ value: f.value || 'all', label: f.label, hint: String(c.tasks.filter(t => !f.value || t.kind === f.value).length) }))}
            onChange={v => setKind(v === 'all' ? '' : v)}
            renderTrigger={open => (
              <button type="button" className={`tk-filter-btn ${kind ? 'active' : ''}`} onClick={open}>
                <Layers size={15} />
                <span><small>النوع</small><strong>{kind ? KIND_FILTERS.find(f => f.value === kind)?.label : 'الكل'}</strong></span>
                <ChevronDown size={15} />
              </button>
            )}
          />
          <MobileSelect
            label="الطبيعة"
            icon={Shapes}
            value={nature || 'all'}
            options={NATURE_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
            onChange={v => setNature(v === 'all' ? '' : v)}
            renderTrigger={open => (
              <button type="button" className={`tk-filter-btn ${nature ? 'active' : ''}`} onClick={open}>
                <Shapes size={15} />
                <span><small>الطبيعة</small><strong>{nature ? NATURE_FILTERS.find(f => f.value === nature)?.label : 'الكل'}</strong></span>
                <ChevronDown size={15} />
              </button>
            )}
          />
          </div>
        </div>

        {content}
        {details}
      </div>
    );
  }

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
        <TopbarSearch value={query} onChange={v => { setQuery(v); setPage(1); }} placeholder="بحث في مهامي..." />
        <CustomDropdown
          options={STATUS_FILTERS.map(f => ({ value: f.value || 'all', label: `${f.label} (${statusCount(f.value)})` }))}
          value={status || 'all'}
          onChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}
        />
        <CustomDropdown
          options={KIND_FILTERS.map(f => ({ value: f.value || 'all', label: `${f.label} (${c.tasks.filter(t => !f.value || t.kind === f.value).length})` }))}
          value={kind || 'all'}
          onChange={v => { setKind(v === 'all' ? '' : v); setPage(1); }}
        />
        <CustomDropdown
          options={NATURE_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
          value={nature || 'all'}
          onChange={v => { setNature(v === 'all' ? '' : v); setPage(1); }}
        />
      </div>

      {content}
      {details}
    </div>
  );
};
