import React, { useState } from 'react';
import { Plus, CalendarClock, Inbox, RefreshCw } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { PageLoader } from '../../shared/PageLoader';
import { MobileAppointments } from '../../Mobile/MobileTasks/MobileAppointments';
import { useTasksAdmin } from './useTasks';
import { AppointmentCard } from './parts/AppointmentCard';
import { TemplateOverlays } from './parts/TemplateOverlays';
import { APPOINTMENT_FILTERS, filterAppointments, NO_APPOINTMENT_FILTER, type AppointmentFilter, type TaskTemplate } from './taskUtils';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Tasks.css';

/**
 * The appointments page (the tasks themselves are on the home page): each one creates its task with every new match /
 * training session / trip / meeting, or every week / month. Like the other pages: the search, the filters (type,
 * nature, state) and «موعد جديد» on one line, then the appointments as cards. Phones: MobileAppointments.
 */
export const Appointments: React.FC<{ tabs?: React.ReactNode }> = ({ tabs }) => {
  const c = useTasksAdmin('templates');
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<AppointmentFilter>(NO_APPOINTMENT_FILTER);
  const [toDelete, setToDelete] = useState<TaskTemplate | null>(null);

  if (isMobile) return <MobileAppointments c={c} tabs={tabs} />;

  const visible = filterAppointments(c.templates, filters);
  const edit = c.can('edit') ? (t: TaskTemplate) => c.openForm({ template: t }) : undefined;
  const toggle = c.can('toggle') ? c.toggleTemplate : undefined;
  const remove = c.can('delete') ? setToDelete : undefined;
  // How many each choice would show, with the other filters applied
  const count = (key: keyof AppointmentFilter, value: string) => filterAppointments(c.templates, { ...filters, [key]: value }).length;

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={filters.query} onChange={v => setFilters({ ...filters, query: v })} placeholder="ابحث بالموعد أو المكلّف..." />
        {APPOINTMENT_FILTERS.map(f => (
          <CustomDropdown
            key={f.key}
            options={f.options.map(o => ({ value: o.value || 'all', label: `${o.label} (${count(f.key, o.value)})` }))}
            value={filters[f.key] || 'all'}
            onChange={v => setFilters({ ...filters, [f.key]: v === 'all' ? '' : v })}
          />
        ))}
        {c.can('add') && <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />موعد جديد</button>}
      </div>

      {tabs}

      {c.loading && !c.templates.length ? <PageLoader mobile={false} text="جاري تحميل المواعيد..." />
        : c.error ? (
          <div className="tk-state">
            <CalendarClock size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="tk-state"><Inbox size={32} /><p>{c.templates.length ? 'لا توجد مواعيد بهذه التصفية' : 'لا توجد مواعيد بعد'}</p></div>
        ) : (
          <div className="tk-grid">
            {visible.map(t => <AppointmentCard key={t.id} t={t} mobile={false} onEdit={edit} onToggle={toggle} onDelete={remove} />)}
          </div>
        )}

      <TemplateOverlays c={c} mobile={false} toDelete={toDelete} onDeleteClose={() => setToDelete(null)} />
    </div>
  );
};
