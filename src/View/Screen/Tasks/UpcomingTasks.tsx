import React, { useState } from 'react';
import { CalendarClock, Inbox, RefreshCw, Search, X } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { PageLoader } from '../../shared/PageLoader';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { useTasksAdmin } from './useTasks';
import { useTaskActions } from './parts/useTaskActions';
import { UpcomingTable } from './parts/TaskTable';
import { UpcomingTaskCard } from './parts/UpcomingTaskCard';
import { filterUpcoming, NO_UPCOMING_FILTER, type UpcomingFilters } from './taskUtils';
import { UpcomingFilterBar } from './parts/UpcomingFilterBar';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Tasks.css';
import '../../Mobile/MobileTasks/MobileTasks.css';


/**
 * The appointments page's other side, like the appointments: the appointments' tasks already created but not on the
 * home page yet (their alert still to come), the soonest first. The search and the filters (kind, nature, status, given
 * or not) on top, then a table (computer) or cards (phones). Each opens its details, its ⋮ as on the home page.
 */
export const UpcomingTasks: React.FC<{ tabs: React.ReactNode }> = ({ tabs }) => {
  const c = useTasksAdmin('upcoming');
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<UpcomingFilters>(NO_UPCOMING_FILTER);
  const { menu, overlays } = useTaskActions(c, isMobile);
  const visible = filterUpcoming(c.tasks, filters);

  const list = c.loading && !c.tasks.length ? <PageLoader mobile={isMobile} text="جاري تحميل المهام القادمة..." />
    : c.error ? (
      <div className="tk-state">
        <CalendarClock size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : visible.length === 0 ? (
      <div className="tk-state"><Inbox size={30} /><p>{c.tasks.length ? 'لا توجد مهام بهذه التصفية' : 'لا توجد مهام قادمة: كل مهام المواعيد ظاهرة في الرئيسية'}</p></div>
    ) : isMobile ? (
      <div className="tsk-hcards tsk-ucards">{visible.map(t => <UpcomingTaskCard key={t.id} task={t} onOpen={c.openTask} menu={menu(t)} />)}</div>
    ) : (
      <div className="table-pagination-wrapper"><UpcomingTable tasks={visible} onOpen={c.openTask} menu={menu} /></div>
    );

  if (isMobile) {
    return (
      <div className="tk-mpage tk-scope">
        <MobileAppBar title="المواعيد" />
        {tabs}
        <div className="tk-toolbar">
          <label className="tk-search">
            <Search size={17} />
            <input type="search" value={filters.query} onChange={e => setFilters({ ...filters, query: e.target.value })} placeholder="ابحث بالمهمة، المكلّف أو التاريخ..." />
            {filters.query && <button type="button" onClick={() => setFilters({ ...filters, query: '' })} aria-label="مسح البحث"><X size={15} /></button>}
          </label>
          <UpcomingFilterBar tasks={c.tasks} value={filters} onChange={setFilters} keys={['source', 'nature', 'status', 'given']} mobile />
        </div>
        {list}
        {overlays}
      </div>
    );
  }

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={filters.query} onChange={v => setFilters({ ...filters, query: v })} placeholder="ابحث بالمهمة، المكلّف أو التاريخ..." />
        <UpcomingFilterBar tasks={c.tasks} value={filters} onChange={setFilters} keys={['source', 'nature', 'status', 'given']} mobile={false} />
      </div>
      {tabs}
      {list}
      {overlays}
    </div>
  );
};
