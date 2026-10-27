import React, { useState } from 'react';
import { CalendarClock, Inbox, RefreshCw, Search, X } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { PageLoader } from '../../shared/PageLoader';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { useMyTasks, useNow } from './useTasks';
import { UpcomingTable } from './parts/TaskTable';
import { UpcomingTaskCard } from './parts/UpcomingTaskCard';
import { TaskChatDialog, TaskDetails } from './parts/TaskDetails';
import { taskMenu } from './parts/taskMenu';
import { filterUpcoming, hasArrived, isOpen, NO_UPCOMING_FILTER, type Task, type UpcomingFilters } from './taskUtils';
import { UpcomingFilterBar } from './parts/UpcomingFilterBar';
import { parseDate } from '../../shared/dates';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Tasks.css';
import '../../Mobile/MobileTasks/MobileTasks.css';

/**
 * Personal space: my appointments — the appointments' tasks given to me that are not on my home page yet (their alert
 * still to come), the soonest first, and when each will show there. A search and the filters (kind, nature, status);
 * each opens its details or its conversation. A table on the computer, cards on phones.
 */
export const MyAppointments: React.FC = () => {
  const c = useMyTasks();
  const isMobile = useIsMobile();
  const now = useNow();
  const [filters, setFilters] = useState<UpcomingFilters>(NO_UPCOMING_FILTER);
  const [chatId, setChatId] = useState<number | null>(null);
  const chatTask = chatId ? c.tasks.find(t => t.id === chatId) : undefined;
  const menu = (t: Task) => taskMenu(t, { open: c.openTask, chat: x => setChatId(x.id) });

  const upcoming = c.tasks
    .filter(t => t.kind === 'scheduled' && isOpen(t) && !hasArrived(t, now))
    .sort((a, b) => (parseDate(a.alert_at)?.getTime() ?? 0) - (parseDate(b.alert_at)?.getTime() ?? 0));
  const visible = filterUpcoming(upcoming, filters);

  const list = c.loading && !c.tasks.length ? <PageLoader mobile={isMobile} text="جاري تحميل المواعيد..." />
    : c.error ? (
      <div className="tk-state">
        <CalendarClock size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : visible.length === 0 ? (
      <div className="tk-state"><Inbox size={30} /><p>{upcoming.length ? 'لا توجد مواعيد بهذه التصفية' : 'لا توجد مواعيد قادمة'}</p></div>
    ) : isMobile ? (
      <div className="tsk-hcards tsk-ucards">{visible.map(t => <UpcomingTaskCard key={t.id} task={t} onOpen={c.openTask} menu={menu(t)} />)}</div>
    ) : (
      <div className="table-pagination-wrapper"><UpcomingTable tasks={visible} onOpen={c.openTask} menu={menu} mine /></div>
    );

  const overlays = (
    <>
      {c.opened && <TaskDetails task={c.opened} mobile={isMobile} onClose={c.closeTask} onChat={() => setChatId(c.opened!.id)} />}
      {chatTask && <TaskChatDialog task={chatTask} mobile={isMobile} onTask={c.replace} onClose={() => setChatId(null)} />}
    </>
  );

  if (isMobile) {
    return (
      <div className="tk-mpage tk-scope">
        <MobileAppBar title="مواعيد" />
        <div className="tk-toolbar">
          <label className="tk-search">
            <Search size={17} />
            <input type="search" value={filters.query} onChange={e => setFilters({ ...filters, query: e.target.value })} placeholder="ابحث بالموعد أو التاريخ..." />
            {filters.query && <button type="button" onClick={() => setFilters({ ...filters, query: '' })} aria-label="مسح البحث"><X size={15} /></button>}
          </label>
          <UpcomingFilterBar tasks={upcoming} value={filters} onChange={setFilters} keys={['source', 'nature', 'status']} mobile />
        </div>
        {list}
        {overlays}
      </div>
    );
  }

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={filters.query} onChange={v => setFilters({ ...filters, query: v })} placeholder="ابحث بالموعد أو التاريخ..." />
        <UpcomingFilterBar tasks={upcoming} value={filters} onChange={setFilters} keys={['source', 'nature', 'status']} mobile={false} />
      </div>
      {list}
      {overlays}
    </div>
  );
};
