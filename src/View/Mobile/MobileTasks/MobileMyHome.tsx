import React, { useState } from 'react';
import { ClipboardList, Inbox, RefreshCw, Archive } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { PageLoader } from '../../shared/PageLoader';
import type { MobileRowMenuItem } from '../widgets/MobileRowMenu';
import type { useMyTasks } from '../../Screen/Tasks/useTasks';
import { filterTasks, homeTasks, onHome, presentStatusFilters, type Task } from '../../Screen/Tasks/taskUtils';
import { MobileHomeTaskCard, MobileTaskRow } from './MobileTaskRow';
import { MobileTaskFilters, type TaskFilterState } from './MobileTaskFilters';
import '../../shared/kit.css';
import '../../Screen/Travels/Travels.css';
import '../../Screen/Debts/Debts.css';
import '../../Screen/Tasks/Tasks.css';
import './MobileTasks.css';

const ARCHIVE_PAGE = 10;

// Phone version of the personal space's home page, like the management's but only mine: the search and filters on
// top, the tasks given to me whose time came as whole cards in their kind's colour (who gave each), the archive's own
// list under it. Each opens its details or its conversation — nothing to add here.
export const MobileMyHome: React.FC<{
  c: ReturnType<typeof useMyTasks>;
  now: number;
  menu: (t: Task) => MobileRowMenuItem[];
  overlays: React.ReactNode;
}> = ({ c, now, menu, overlays }) => {
  const [archiveShownCount, setArchiveShownCount] = useState(ARCHIVE_PAGE);
  const [filters, setFilters] = useState<TaskFilterState>({ query: '', status: '', kind: '', nature: '' });

  const shown = onHome(c.tasks, now);
  const { live, archive } = homeTasks(filterTasks(shown, filters.status, filters.query, filters.nature, filters.kind), now);
  const archiveShown = archive.slice(0, archiveShownCount);
  const filtered = Boolean(filters.query || filters.status || filters.kind || filters.nature);

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="الرئيسية" />

      <MobileTaskFilters tasks={shown} value={filters} onChange={setFilters} statuses={presentStatusFilters(shown, filters.status)} />

      {c.loading && !c.tasks.length ? <PageLoader mobile text="جاري تحميل مهامي..." />
        : c.error ? (
          <div className="tk-state">
            <ClipboardList size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : (
          <div className="tsk-sections">
            <section className="tsk-sec">
              <h3 className="tsk-sec-head">
                <span className="tsk-sec-icon"><ClipboardList size={16} /></span>مهامي<b>{live.length}</b>
              </h3>
              {live.length
                ? <div className="tsk-hcards">{live.map(t => <MobileHomeTaskCard key={t.id} task={t} onOpen={c.openTask} menu={menu(t)} mine />)}</div>
                : <div className="tk-state"><Inbox size={30} /><p>{filtered ? 'لا توجد مهام بهذه التصفية' : 'لا توجد مهام حالياً'}</p></div>}
            </section>

            {archive.length > 0 && (
              <section className="tsk-sec archive">
                <h3 className="tsk-sec-head">
                  <span className="tsk-sec-icon"><Archive size={16} /></span>الأرشيف<b>{archive.length}</b>
                </h3>
                <div className="tsk-mlist">{archiveShown.map(t => <MobileTaskRow key={t.id} task={t} onOpen={c.openTask} mine menu={menu(t)} />)}</div>
                {archive.length > archiveShown.length && (
                  <button type="button" className="tk-more" onClick={() => setArchiveShownCount(n => n + ARCHIVE_PAGE)}>عرض المزيد ({archive.length - archiveShown.length})</button>
                )}
              </section>
            )}
          </div>
        )}

      {overlays}
    </div>
  );
};
