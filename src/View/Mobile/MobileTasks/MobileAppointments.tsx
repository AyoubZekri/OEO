import React, { useState } from 'react';
import { Plus, RefreshCw, Search, X, ChevronDown } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileSelect } from '../widgets/MobileSelect';
import { PageLoader } from '../../shared/PageLoader';
import type { TasksAdmin } from '../../Screen/Tasks/useTasks';
import { TemplateOverlays } from '../../Screen/Tasks/parts/TemplateOverlays';
import { AppointmentCard } from '../../Screen/Tasks/parts/AppointmentCard';
import { TaskSelectionBar } from '../../Screen/Tasks/parts/TaskSelection';
import { useTaskSelection } from '../../Screen/Tasks/parts/useTaskSelection';
import { APPOINTMENT_FILTERS, filterAppointments, NO_APPOINTMENT_FILTER, type AppointmentFilter, type TaskTemplate } from '../../Screen/Tasks/taskUtils';
import '../../shared/kit.css';
import '../../Screen/Travels/Travels.css';
import '../../Screen/Debts/Debts.css';
import '../../Screen/Tasks/Tasks.css';
import './MobileTasks.css';
import { StateIcon } from '../../widget/StateIcon';

// Phone version of the appointments page, like the other pages: the search and three filters (type, nature, state —
// a bottom sheet each), the appointments as cards, and the floating add button
export const MobileAppointments: React.FC<{ c: TasksAdmin; tabs?: React.ReactNode }> = ({ c, tabs }) => {
  const [filters, setFilters] = useState<AppointmentFilter>(NO_APPOINTMENT_FILTER);
  const [toDelete, setToDelete] = useState<TaskTemplate | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  // Hold a card to select it, then tap the others: deleted together (as on the home page)
  // Edit (one selected) and delete are in the selection bar, not in ⋮
  const select = useTaskSelection(c.can('delete') || c.can('edit'));

  const visible = filterAppointments(c.templates, filters);
  const toggle = c.can('toggle') ? c.toggleTemplate : undefined;
  // Its details: the current one from the list (a change made meanwhile shows)
  const viewing = c.templates.find(t => t.id === viewingId) ?? null;
  const view = (t: TaskTemplate) => setViewingId(t.id);
  const count = (key: keyof AppointmentFilter, value: string) => filterAppointments(c.templates, { ...filters, [key]: value }).length;

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="المواعيد" />

      {tabs}

      <div className="tk-toolbar">
        <label className="tk-search">
          <Search size={17} />
          <input type="search" value={filters.query} onChange={e => setFilters({ ...filters, query: e.target.value })} placeholder="ابحث بالموعد أو المكلّف..." />
          {filters.query && <button type="button" onClick={() => setFilters({ ...filters, query: '' })} aria-label="مسح البحث"><X size={15} /></button>}
        </label>
        <div className="tk-mfilters tsk-mfilters3">
          {APPOINTMENT_FILTERS.map(f => (
            <MobileSelect
              key={f.key}
              label={f.label}
              icon={f.icon}
              value={filters[f.key] || 'all'}
              options={f.options.map(o => ({ value: o.value || 'all', label: o.label, hint: String(count(f.key, o.value)) }))}
              onChange={v => setFilters({ ...filters, [f.key]: v === 'all' ? '' : v })}
              renderTrigger={open => (
                <button type="button" className={`tk-filter-btn ${filters[f.key] ? 'active' : ''}`} onClick={open}>
                  <f.icon size={15} />
                  <span><small>{f.label}</small><strong>{filters[f.key] ? f.options.find(o => o.value === filters[f.key])?.label : 'الكل'}</strong></span>
                  <ChevronDown size={15} />
                </button>
              )}
            />
          ))}
        </div>
      </div>

      {c.loading && !c.templates.length ? <PageLoader mobile text="جاري تحميل المواعيد..." />
        : c.error ? (
          <div className="tk-state">
            <StateIcon failed />
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <StateIcon />
        ) : (
          <div className="tk-list">{visible.map(t => <AppointmentCard key={t.id} t={t} select={select} onView={view} onToggle={toggle} />)}</div>
        )}

      {!select.active && c.can('add') && (
        <button type="button" className="tk-fab" onClick={() => c.openForm()} aria-label="موعد جديد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <TaskSelectionBar s={select} tasks={visible} mobile of="appointments" onEdit={c.can('edit') ? id => { const t = c.templates.find(x => x.id === id); if (t) c.openForm({ template: t }); } : undefined} onDelete={c.can('delete') ? c.removeTemplates : undefined} />
      <TemplateOverlays c={c} mobile viewing={viewing} onViewClose={() => setViewingId(null)} toDelete={toDelete} onDeleteClose={() => setToDelete(null)} />
    </div>
  );
};
