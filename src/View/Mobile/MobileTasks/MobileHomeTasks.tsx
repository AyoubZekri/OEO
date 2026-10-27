import React, { useState } from 'react';
import { Plus, ClipboardList, Inbox, RefreshCw, Mic, Archive } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { PageLoader } from '../../shared/PageLoader';
import { useNow, type TasksAdmin } from '../../Screen/Tasks/useTasks';
import { useTaskActions } from '../../Screen/Tasks/parts/useTaskActions';
import { VOICE_NOTES } from '../../Screen/Tasks/parts/voiceNote';
import { TaskSelectionBar } from '../../Screen/Tasks/parts/TaskSelection';
import { useTaskSelection } from '../../Screen/Tasks/parts/useTaskSelection';
import { filterTasks, homeTasks, onHome, presentStatusFilters } from '../../Screen/Tasks/taskUtils';
import { MobileHomeTaskCard, MobileTaskRow } from './MobileTaskRow';
import { MobileTaskFilters, type TaskFilterState } from './MobileTaskFilters';
import '../../shared/kit.css';
import '../../Screen/Travels/Travels.css';
import '../../Screen/Debts/Debts.css';
import '../../Screen/Tasks/Tasks.css';
import './MobileTasks.css';

const ARCHIVE_PAGE = 10;

// Phone version of the home page: the search and filters on top (status, kind, nature), the tasks whose time came as
// whole cards in their kind's colour (urgent red, appointments orange, voice notes pale blue, normal white), the
// archive's own list under it, and the two floating buttons (voice note, new task)
export const MobileHomeTasks: React.FC<{ c: TasksAdmin }> = ({ c }) => {
  const [archiveShownCount, setArchiveShownCount] = useState(ARCHIVE_PAGE);
  const { menu, overlays } = useTaskActions(c, true);

  const [filters, setFilters] = useState<TaskFilterState>({ query: '', status: '', kind: '', nature: '' });

  const now = useNow();
  // Only what the home page shows (an appointment's task from its alert time on), counted and filtered
  const shown = onHome(c.tasks, now);
  const { live, archive } = homeTasks(filterTasks(shown, filters.status, filters.query, filters.nature, filters.kind), now);
  const archiveShown = archive.slice(0, archiveShownCount);
  // Hold a card to select it, then tap the others: deleted together
  const select = useTaskSelection(c.can('delete'));

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="الرئيسية" />

      <MobileTaskFilters tasks={shown} value={filters} onChange={setFilters} statuses={presentStatusFilters(shown, filters.status)} />

      {c.loading && !c.tasks.length ? <PageLoader mobile text="جاري تحميل المهام..." />
        : c.error ? (
          <div className="tk-state">
            <ClipboardList size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : (
          <div className="tsk-sections">
            <section className="tsk-sec">
              <h3 className="tsk-sec-head">
                <span className="tsk-sec-icon"><ClipboardList size={16} /></span>المهام<b>{live.length}</b>
              </h3>
              {live.length
                ? <div className="tsk-hcards">{live.map(t => <MobileHomeTaskCard key={t.id} task={t} onOpen={c.openTask} menu={menu(t)} select={select} />)}</div>
                : <div className="tk-state"><Inbox size={30} /><p>{filters.query || filters.status || filters.kind || filters.nature ? 'لا توجد مهام بهذه التصفية' : 'لا توجد مهام حالياً'}</p></div>}
            </section>

            {archive.length > 0 && (
              <section className="tsk-sec archive">
                <h3 className="tsk-sec-head">
                  <span className="tsk-sec-icon"><Archive size={16} /></span>المنجزة والملغاة<b>{archive.length}</b>
                </h3>
                <div className="tsk-mlist">{archiveShown.map(t => <MobileTaskRow key={t.id} task={t} onOpen={c.openTask} menu={menu(t)} select={select} />)}</div>
                {archive.length > archiveShown.length && (
                  <button type="button" className="tk-more" onClick={() => setArchiveShownCount(n => n + ARCHIVE_PAGE)}>عرض المزيد ({archive.length - archiveShown.length})</button>
                )}
              </section>
            )}
          </div>
        )}

      <TaskSelectionBar s={select} tasks={[...live, ...archiveShown]} mobile onDelete={c.removeMany} />

      {!select.active && c.can('voice') && VOICE_NOTES && (
        <button type="button" className={`tk-fab ${c.can('add') || c.canAppointments('add') ? 'tsk-fab-voice' : ''}`} onClick={() => c.openForm({ voice: true })} aria-label="تنبيه صوتي">
          <Mic size={22} strokeWidth={2.5} />
        </button>
      )}
      {!select.active && (c.can('add') || c.canAppointments('add')) && (
        <button type="button" className="tk-fab" onClick={() => c.openForm()} aria-label="مهمة جديدة">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {overlays}
    </div>
  );
};
