import React, { useMemo, useState } from 'react';
import { Search, RefreshCw, Inbox, ListTodo } from 'lucide-react';
import { CustomDropdown } from '../../../widget/CustomDropdown';
import { Pagination } from '../../../widget/Pagination';
import { TaskTable } from './TaskTable';
import { ItemsPerPageSelector } from '../../../widget/ItemsPerPageSelector';
import { TaskDashboard } from './TaskDashboard';
import { TemplateList } from './TemplateList';
import { TaskLoader } from './TaskLoader';
import type { TasksController } from '../useTasksController';
import { filterTasks, KIND_FILTERS, TASK_FILTERS } from '../taskUtils';

const EMPTY: Record<string, string> = {
  tasks: 'لا توجد مهام حالياً',
};


/** Desktop page body: search, the status and type filters and the add button, then the tasks in a table (like the members) */
export const TaskBoard: React.FC<{ c: TasksController; addButton: React.ReactNode }> = ({ c, addButton }) => {
  // Status filter: everything by default
  const [filter, setFilter] = useState('');
  const [kind, setKind] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const counts = useMemo(() => Object.fromEntries(TASK_FILTERS.map(f => [f.value, c.tasks.filter(f.test).length])), [c.tasks]);
  const kindCounts = useMemo(() => Object.fromEntries(KIND_FILTERS.map(k => [k.value, c.tasks.filter(t => !k.value || t.source_type === k.value).length])), [c.tasks]);
  const visible = filterTasks(c.tasks, filter, query, kind);
  const rows = visible.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <div className="tk-actions-row">
        {c.isList && (
          <>
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="ابحث بالعنوان أو المرجع أو المكلف..."
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            <CustomDropdown
              options={TASK_FILTERS.map(f => ({ value: f.value || 'all', label: `${f.label} (${counts[f.value]})` }))}
              value={filter || 'all'}
              onChange={v => { setFilter(v === 'all' ? '' : v); setPage(1); }}
            />
            <CustomDropdown
              options={KIND_FILTERS.map(k => ({ value: k.value || 'all', label: `${k.label} (${kindCounts[k.value]})` }))}
              value={kind || 'all'}
              onChange={v => { setKind(v === 'all' ? '' : v); setPage(1); }}
            />
          </>
        )}
        {addButton}
      </div>

      <div>
        <div className="tk-main-col">
          {c.tab === 'dashboard' ? <TaskDashboard c={c} mobile={false} />
            : c.tab === 'templates' ? <TemplateList c={c} mobile={false} />
              : c.loading && !c.tasks.length ? (
                <TaskLoader mobile={false} />
              ) : c.error ? (
                <div className="tk-state">
                  <ListTodo size={30} /><p>{c.error}</p>
                  <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
                </div>
              ) : visible.length === 0 ? (
                <div className="tk-state"><Inbox size={32} /><p>{c.tasks.length === 0 ? EMPTY[c.tab] || 'لا توجد مهام' : 'لا توجد مهام بهذه التصفية'}</p></div>
              ) : (
                <div className="table-pagination-wrapper">
                  <ItemsPerPageSelector itemsPerPage={perPage} onItemsPerPageChange={setPerPage} onPageChange={setPage} />
                  <TaskTable tasks={rows} c={c} />
                  <Pagination totalItems={visible.length} itemsPerPage={perPage} currentPage={page} onPageChange={setPage} onItemsPerPageChange={setPerPage} />
                </div>
              )}
        </div>
      </div>
    </>
  );
};
