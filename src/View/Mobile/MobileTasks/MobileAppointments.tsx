import React, { useState } from 'react';
import { Plus, CalendarClock, Inbox, RefreshCw, Search, X, ChevronDown, Shapes, Power, PowerOff, Zap } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileSelect } from '../widgets/MobileSelect';
import { PageLoader } from '../../shared/PageLoader';
import type { TasksAdmin } from '../../Screen/Tasks/useTasks';
import { TemplateOverlays } from '../../Screen/Tasks/parts/TemplateOverlays';
import { NATURE_FILTERS, type TaskTemplate } from '../../Screen/Tasks/taskUtils';
import { MobileTemplateRow } from './MobileTaskRow';
import '../../shared/kit.css';
import '../../Screen/Travels/Travels.css';
import '../../Screen/Debts/Debts.css';
import '../../Screen/Tasks/Tasks.css';
import './MobileTasks.css';

// Phone version of the tasks page, its appointments tab: the figures in the hero, the tabs, search and the nature
// filter, the list, and the floating add button
export const MobileAppointments: React.FC<{ c: TasksAdmin; tabs?: React.ReactNode }> = ({ c, tabs }) => {
  const [query, setQuery] = useState('');
  const [nature, setNature] = useState('');
  const [toDelete, setToDelete] = useState<TaskTemplate | null>(null);

  const q = query.trim().toLowerCase();
  const visible = c.templates.filter(t => (!nature || t.nature === nature) && (!q || [t.title, t.assignee?.name].some(v => (v || '').toLowerCase().includes(q))));
  const active = c.templates.filter(t => t.status === 'active').length;

  const edit = c.can('edit') ? (t: TaskTemplate) => c.openForm({ template: t }) : undefined;
  const toggle = c.can('edit') ? c.toggleTemplate : undefined;
  const remove = c.can('delete') ? setToDelete : undefined;

  const figures = [
    { label: 'المواعيد', v: c.templates.length, icon: CalendarClock, tone: 'violet' },
    { label: 'مفعلة', v: active, icon: Power, tone: 'green' },
    { label: 'متوقفة', v: c.templates.length - active, icon: PowerOff, tone: 'slate' },
    { label: 'مع الأحداث', v: c.templates.filter(t => t.schedule === 'event').length, icon: Zap, tone: 'orange' },
  ];
  const natureLabel = nature ? NATURE_FILTERS.find(f => f.value === nature)?.label : 'الكل';

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

      <div className="tk-toolbar">
        <label className="tk-search">
          <Search size={17} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث..." />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
        </label>
        <MobileSelect
          label="الطبيعة"
          icon={Shapes}
          value={nature || 'all'}
          options={NATURE_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
          onChange={v => setNature(v === 'all' ? '' : v)}
          renderTrigger={open => (
            <button type="button" className={`tk-filter-btn ${nature ? 'active' : ''}`} onClick={open}>
              <Shapes size={15} />
              <span><small>الطبيعة</small><strong>{natureLabel}</strong></span>
              <ChevronDown size={15} />
            </button>
          )}
        />
      </div>

      {c.loading && !c.templates.length ? <PageLoader mobile text="جاري تحميل المواعيد..." />
        : c.error ? (
          <div className="tk-state">
            <CalendarClock size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? <div className="tk-state"><Inbox size={30} /><p>{c.templates.length ? 'لا توجد مواعيد بهذه التصفية' : 'لا توجد مواعيد'}</p></div>
          : <div className="tsk-mlist">{visible.map(t => <MobileTemplateRow key={t.id} t={t} onEdit={edit} onToggle={toggle} onDelete={remove} />)}</div>}

      {c.can('add') && (
        <button type="button" className="tk-fab" onClick={() => c.openForm()} aria-label="موعد جديد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <TemplateOverlays c={c} mobile toDelete={toDelete} onDeleteClose={() => setToDelete(null)} />
    </div>
  );
};
