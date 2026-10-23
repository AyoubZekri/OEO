import React, { useState } from 'react';
import { Plus, ClipboardList, Inbox, RefreshCw, Mic, Archive } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { Pagination } from '../../widget/Pagination';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { PageLoader } from '../../shared/PageLoader';
import { MobileHomeTasks } from '../../Mobile/MobileTasks/MobileHomeTasks';
import { useNow, useTasksAdmin } from './useTasks';
import { TaskTable } from './parts/TaskTable';
import { useTaskActions } from './parts/useTaskActions';
import { filterTasks, homeTasks, KIND_FILTERS, NATURE_FILTERS, onHome, presentStatusFilters, STATUS_FILTERS } from './taskUtils';
import '../../shared/kit.css';
import '../Travels/Travels.css';
import '../Debts/Debts.css';
import './Tasks.css';

const ARCHIVE_PAGE = 10;

/**
 * The management's home page, the tasks whose time came in one table — urgent (red, glowing), appointments (orange: birthdays,
 * matches, trips, meetings, training sessions, or periodic), voice notes (green), normal tasks (white) — and the archive's
 * own table apart at the bottom. An appointment's task shows once its alert time is reached. Phones: MobileHomeTasks.
 */
export const HomeTasks: React.FC = () => {
  const c = useTasksAdmin('tasks');
  const isMobile = useIsMobile();
  const now = useNow();
  const [archivePage, setArchivePage] = useState(1);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [nature, setNature] = useState('');
  const { menu, overlays } = useTaskActions(c, isMobile);

  if (isMobile) return <MobileHomeTasks c={c} />;

  // Only what the home page shows (an appointment's task from its alert time on), counted and filtered
  const shown = onHome(c.tasks, now);
  const { live, archive } = homeTasks(filterTasks(shown, status, query, nature, kind), now);
  const filtered = Boolean(status || query || kind || nature);
  const statusCount = (v: string) => shown.filter(STATUS_FILTERS.find(f => f.value === v)!.test).length;
  const kindCount = (v: string) => shown.filter(t => !v || t.kind === v).length;
  // A filter changed: the archive from its first page
  const pick = (set: (v: string) => void) => (v: string) => { set(v === 'all' ? '' : v); setArchivePage(1); };
  const archiveShown = archive.slice((archivePage - 1) * ARCHIVE_PAGE, archivePage * ARCHIVE_PAGE);

  const content = c.loading && !c.tasks.length ? <PageLoader mobile={false} text="جاري تحميل المهام..." />
    : c.error ? (
      <div className="tk-state">
        <ClipboardList size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : (
      <div className="tsk-sections">
        <section className="tsk-sec">
          <h3 className="tsk-sec-head tone-blue">
            <span className="tsk-sec-icon"><ClipboardList size={16} /></span>المهام<b>{live.length}</b>
          </h3>
          {live.length
            ? <div className="table-pagination-wrapper"><TaskTable tasks={live} onOpen={c.openTask} menu={menu} tint /></div>
            : <div className="tk-state"><Inbox size={30} /><p>{filtered ? 'لا توجد مهام بهذه التصفية' : 'لا توجد مهام حالياً'}</p></div>}
        </section>

        {archive.length > 0 && (
          <section className="tsk-sec archive">
            <h3 className="tsk-sec-head tone-slate">
              <span className="tsk-sec-icon"><Archive size={16} /></span>الأرشيف<b>{archive.length}</b>
            </h3>
            <div className="table-pagination-wrapper">
              <TaskTable tasks={archiveShown} onOpen={c.openTask} menu={menu} />
              {archive.length > ARCHIVE_PAGE && (
                <Pagination totalItems={archive.length} itemsPerPage={ARCHIVE_PAGE} currentPage={archivePage} onPageChange={setArchivePage} onItemsPerPageChange={() => undefined} />
              )}
            </div>
          </section>
        )}
      </div>
    );

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={query} onChange={v => { setQuery(v); setArchivePage(1); }} placeholder="بحث بالمهمة، التفاصيل، المكلّف أو التاريخ..." />
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
        {c.can('add') && <button type="button" className="btn-primary tsk-voice-add" onClick={() => c.openForm({ voice: true })}><Mic size={18} />تنبيه صوتي</button>}
        {c.can('add') && <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />مهمة جديدة</button>}
      </div>

      {content}
      {overlays}
    </div>
  );
};
