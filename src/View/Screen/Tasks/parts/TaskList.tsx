import React, { useMemo, useState } from 'react';
import { Search, X, ListTodo, RefreshCw, Inbox, Filter, ChevronDown, Layers, Trash2 } from 'lucide-react';
import { MobileSelect } from '../../../Mobile/widgets/MobileSelect';
import { TaskCard } from './TaskCard';
import { MobileTaskCard } from './MobileTaskCard';
import { TaskPanel } from './TaskPanel';
import { TaskLoader } from './TaskLoader';
import type { TasksController } from '../useTasksController';
import { filterTasks, KIND_FILTERS, TASK_FILTERS, type Task } from '../taskUtils';

const PAGE = 30;

const EMPTY: Record<string, string> = {
  tasks: 'لا توجد مهام حالياً',
  archive: 'الأرشيف فارغ',
};

/** Phone list: search, the status filter in a bottom sheet (today, in progress, overdue, returned, blocked…) and the task cards */
export const TaskList: React.FC<{ c: TasksController; mobile: boolean }> = ({ c, mobile }) => {
  // Status filter: everything by default
  const [filter, setFilter] = useState('');
  const [kind, setKind] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const counts = useMemo(() => Object.fromEntries(TASK_FILTERS.map(f => [f.value, c.tasks.filter(f.test).length])), [c.tasks]);
  const visible = filterTasks(c.tasks, filter, query, kind);
  const filters = c.tab === 'archive' ? [TASK_FILTERS[0]] : TASK_FILTERS.filter(f => f.value === '' || f.value === filter || counts[f.value] > 0);

  if (c.loading && !c.tasks.length) {
    return <TaskLoader mobile={mobile} />;
  }
  if (c.error) {
    return (
      <div className="tk-state">
        <ListTodo size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="tk-list-wrap">
      <div className="tk-toolbar">
        <label className="tk-search">
          <Search size={17} />
          <input type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="ابحث بالعنوان أو المرجع أو المكلف..." />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
        </label>
        <div className="tk-mfilters">
          {filters.length > 1 && (
            <MobileSelect
              label="الحالة"
              icon={Filter}
              value={filter || 'all'}
              options={filters.map(f => ({ value: f.value || 'all', label: f.label, hint: String(counts[f.value]) }))}
              onChange={v => { setFilter(v === 'all' ? '' : v); setLimit(PAGE); }}
              renderTrigger={open => (
                <button type="button" className={`tk-filter-btn ${filter ? 'active' : ''}`} onClick={open}>
                  <Filter size={15} />
                  <span><small>الحالة</small><strong>{TASK_FILTERS.find(f => f.value === filter)?.label || 'الكل'}</strong></span>
                    <ChevronDown size={15} />
                </button>
              )}
            />
          )}
          <MobileSelect
            label="النوع"
            icon={Layers}
            value={kind || 'all'}
            options={KIND_FILTERS.map(k => ({ value: k.value || 'all', label: k.label, hint: String(c.tasks.filter(t => !k.value || t.source_type === k.value).length) }))}
            onChange={v => { setKind(v === 'all' ? '' : v); setLimit(PAGE); }}
            renderTrigger={open => (
              <button type="button" className={`tk-filter-btn ${kind ? 'active' : ''}`} onClick={open}>
                <Layers size={15} />
                <span><small>النوع</small><strong>{KIND_FILTERS.find(k => k.value === kind)?.label || 'كل الأنواع'}</strong></span>
                <ChevronDown size={15} />
              </button>
            )}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="tk-state">
          <Inbox size={32} />
          <p>{c.tasks.length === 0 ? EMPTY[c.tab] || 'لا توجد مهام' : 'لا توجد مهام بهذه التصفية'}</p>
        </div>
      ) : (
        <div className={mobile ? 'tk-list' : 'tk-grid'}>
          {visible.slice(0, limit).map(t => (mobile
            ? <MobileTaskCard key={t.id} c={c} task={t} onDelete={setToDelete} />
            : <TaskCard key={t.id} task={t} onOpen={c.openTask} userId={c.userId} />))}
        </div>
      )}
      {visible.length > limit && (
        <button type="button" className="tk-more" onClick={() => setLimit(l => l + PAGE)}>عرض المزيد ({visible.length - limit})</button>
      )}
      {toDelete && (
        <TaskPanel
          mobile={mobile}
          sheet
          size="sm"
          layer={2}
          title="حذف المهمة"
          onClose={() => setToDelete(null)}
          footer={(
            <>
              <button type="button" className="tk-btn ghost" onClick={() => setToDelete(null)}>إلغاء</button>
              <button type="button" className="tk-btn danger" onClick={() => { c.deleteTask(toDelete); setToDelete(null); }}><Trash2 size={17} />حذف</button>
            </>
          )}
        >
          <p className="tk-text">تُنقل المهمة «{toDelete.title}» إلى الأرشيف مع سجلها وإثباتاتها.</p>
        </TaskPanel>
      )}
    </div>
  );
};
