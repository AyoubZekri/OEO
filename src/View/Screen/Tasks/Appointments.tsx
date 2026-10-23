import React, { useState } from 'react';
import { Plus, CalendarClock, Inbox, RefreshCw, Power, PowerOff, Zap } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { PageLoader } from '../../shared/PageLoader';
import { MobileAppointments } from '../../Mobile/MobileTasks/MobileAppointments';
import { useTasksAdmin } from './useTasks';
import { TemplateTable } from './parts/TaskTable';
import { TemplateOverlays } from './parts/TemplateOverlays';
import { NATURE_FILTERS, type TaskTemplate } from './taskUtils';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Tasks.css';

/**
 * The home page's appointments tab: each one creates its task with every new match / training session / trip /
 * meeting, or every week / month. Added, edited, stopped / started or deleted here. Phones: MobileAppointments.
 */
export const Appointments: React.FC<{ tabs?: React.ReactNode }> = ({ tabs }) => {
  const c = useTasksAdmin('templates');
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [nature, setNature] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [toDelete, setToDelete] = useState<TaskTemplate | null>(null);

  if (isMobile) return <MobileAppointments c={c} tabs={tabs} />;

  const q = query.trim().toLowerCase();
  const visible = c.templates.filter(t => (!nature || t.nature === nature) && (!q || [t.title, t.assignee?.name].some(v => (v || '').toLowerCase().includes(q))));
  const active = c.templates.filter(t => t.status === 'active').length;

  const edit = c.can('edit') ? (t: TaskTemplate) => c.openForm({ template: t }) : undefined;
  const toggle = c.can('edit') ? c.toggleTemplate : undefined;
  const remove = c.can('delete') ? setToDelete : undefined;

  const content = c.loading && !c.templates.length ? <PageLoader mobile={false} text="جاري تحميل المواعيد..." />
    : c.error ? (
      <div className="tk-state">
        <CalendarClock size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : visible.length === 0 ? <div className="tk-state"><Inbox size={30} /><p>{c.templates.length ? 'لا توجد مواعيد بهذه التصفية' : 'لا توجد مواعيد'}</p></div>
      : (
        <div className="table-pagination-wrapper">
          <ItemsPerPageSelector itemsPerPage={perPage} onItemsPerPageChange={setPerPage} onPageChange={setPage} />
          <TemplateTable templates={visible.slice((page - 1) * perPage, page * perPage)} onEdit={edit} onToggle={toggle} onDelete={remove} />
          <Pagination totalItems={visible.length} itemsPerPage={perPage} currentPage={page} onPageChange={setPage} onItemsPerPageChange={setPerPage} />
        </div>
      );

  const figures = [
    { label: 'المواعيد', v: c.templates.length, icon: CalendarClock, tone: 'violet' },
    { label: 'مفعلة', v: active, icon: Power, tone: 'green' },
    { label: 'متوقفة', v: c.templates.length - active, icon: PowerOff, tone: 'slate' },
    { label: 'مع الأحداث', v: c.templates.filter(t => t.schedule === 'event').length, icon: Zap, tone: 'orange' },
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
        <TopbarSearch value={query} onChange={v => { setQuery(v); setPage(1); }} placeholder="بحث بالموعد أو المكلّف..." />
        <CustomDropdown
          options={NATURE_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
          value={nature || 'all'}
          onChange={v => { setNature(v === 'all' ? '' : v); setPage(1); }}
        />
        {c.can('add') && <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />موعد جديد</button>}
      </div>

      {tabs}

      {content}
      <TemplateOverlays c={c} mobile={false} toDelete={toDelete} onDeleteClose={() => setToDelete(null)} />
    </div>
  );
};
