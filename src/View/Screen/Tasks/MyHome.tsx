import React, { useState } from 'react';
import { ClipboardList, Inbox, RefreshCw, Archive } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { Pagination } from '../../widget/Pagination';
import { PageLoader } from '../../shared/PageLoader';
import { MobileMyHome } from '../../Mobile/MobileTasks/MobileMyHome';
import { useMyTasks, useNow } from './useTasks';
import { TaskTable } from './parts/TaskTable';
import { TaskChatDialog, TaskDetails } from './parts/TaskDetails';
import { taskMenu } from './parts/taskMenu';
import { filterTasks, homeTasks, KIND_FILTERS, NATURE_FILTERS, onHome, presentStatusFilters, STATUS_FILTERS, type Task } from './taskUtils';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Tasks.css';

const ARCHIVE_PAGE = 10;

/**
 * The personal space's home page, like the management's but only mine: the tasks given to me whose time came in one
 * table (urgent, appointments, voice notes, normal), the archive's own table at the bottom, the search and filters on
 * top. Each opens its details or its conversation — nothing to add or change here. Phones: MobileMyHome.
 */
export const MyHome: React.FC = () => {
  const c = useMyTasks();
  const isMobile = useIsMobile();
  const now = useNow();
  const [archivePage, setArchivePage] = useState(1);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [nature, setNature] = useState('');
  const [chatId, setChatId] = useState<number | null>(null);
  const chatTask = chatId ? c.tasks.find(t => t.id === chatId) : undefined;
  // Mine: the details and the conversation only
  const menu = (t: Task) => taskMenu(t, { open: c.openTask, chat: x => setChatId(x.id) });

  const overlays = (
    <>
      {c.opened && <TaskDetails task={c.opened} mobile={isMobile} onClose={c.closeTask} />}
      {chatTask && <TaskChatDialog task={chatTask} mobile={isMobile} onTask={c.replace} onClose={() => setChatId(null)} />}
    </>
  );

  if (isMobile) return <MobileMyHome c={c} now={now} menu={menu} overlays={overlays} />;

  // Only what the home page shows (an appointment's task from its alert time on), counted and filtered
  const shown = onHome(c.tasks, now);
  const { live, archive } = homeTasks(filterTasks(shown, status, query, nature, kind), now);
  const archiveShown = archive.slice((archivePage - 1) * ARCHIVE_PAGE, archivePage * ARCHIVE_PAGE);
  const filtered = Boolean(status || query || kind || nature);
  const statusCount = (v: string) => shown.filter(STATUS_FILTERS.find(f => f.value === v)!.test).length;
  const kindCount = (v: string) => shown.filter(t => !v || t.kind === v).length;
  const pick = (set: (v: string) => void) => (v: string) => { set(v === 'all' ? '' : v); setArchivePage(1); };

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={query} onChange={v => { setQuery(v); setArchivePage(1); }} placeholder="بحث بالمهمة، التفاصيل أو التاريخ..." />
        <CustomDropdown
          options={presentStatusFilters(shown, status).map(f => ({ value: f.value || 'all', label: `${f.label} (${statusCount(f.value)})` }))}
          value={status || 'all'}
          onChange={pick(setStatus)}
        />
        <CustomDropdown
          options={KIND_FILTERS.map(f => ({ value: f.value || 'all', label: `${f.label} (${kindCount(f.value)})` }))}
          value={kind || 'all'}
          onChange={pick(setKind)}
        />
        <CustomDropdown
          options={NATURE_FILTERS.map(f => ({ value: f.value || 'all', label: f.label }))}
          value={nature || 'all'}
          onChange={pick(setNature)}
        />
      </div>

      {c.loading && !c.tasks.length ? <PageLoader mobile={false} text="جاري تحميل مهامي..." />
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
                ? <div className="table-pagination-wrapper"><TaskTable tasks={live} onOpen={c.openTask} mine menu={menu} tint /></div>
                : <div className="tk-state"><Inbox size={30} /><p>{filtered ? 'لا توجد مهام بهذه التصفية' : 'لا توجد مهام حالياً'}</p></div>}
            </section>

            {archive.length > 0 && (
              <section className="tsk-sec archive">
                <h3 className="tsk-sec-head">
                  <span className="tsk-sec-icon"><Archive size={16} /></span>الأرشيف<b>{archive.length}</b>
                </h3>
                <div className="table-pagination-wrapper">
                  <TaskTable tasks={archiveShown} onOpen={c.openTask} mine menu={menu} />
                  {archive.length > ARCHIVE_PAGE && (
                    <Pagination totalItems={archive.length} itemsPerPage={ARCHIVE_PAGE} currentPage={archivePage} onPageChange={setArchivePage} onItemsPerPageChange={() => undefined} />
                  )}
                </div>
              </section>
            )}
          </div>
        )}

      {overlays}
    </div>
  );
};
