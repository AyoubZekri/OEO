import React, { useState } from 'react';
import { Plus, Search, X, Repeat, RefreshCw, Inbox, Filter, ChevronDown, Power, PowerOff, Zap, Trash2 } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import { MobileSelect } from '../../Mobile/widgets/MobileSelect';
import { useTasksController } from './useTasksController';
import { TaskOverlays } from './parts/TaskViews';
import { TaskLoader } from './parts/TaskLoader';
import { TaskPanel } from './parts/TaskPanel';
import { BaseCard } from './parts/BaseCard';
import { MobileBaseCard } from './parts/MobileBaseCard';
import type { TaskTemplate } from './taskUtils';
import './Tasks.css';

const FILTERS = [
  { value: '', label: 'الكل' },
  { value: 'active', label: 'المفعلة' },
  { value: 'stopped', label: 'المتوقفة' },
  { value: 'periodic', label: 'الدورية' },
  { value: 'event', label: 'مع الأحداث' },
];

const matches = (t: TaskTemplate, filter: string, q: string) =>
  (!filter
    || (filter === 'active' && t.active) || (filter === 'stopped' && !t.active)
    || (filter === 'periodic' && t.kind === 'periodic') || (filter === 'event' && t.kind === 'event'))
  && (!q || t.title.toLowerCase().includes(q) || (t.assignee_name || '').toLowerCase().includes(q));

// The base periodic (and automatic) tasks, on their own page: each one is added, edited, switched on / off or deleted
// here. The tasks they create appear on the tasks page.
export const PeriodicTasks: React.FC = () => {
  const c = useTasksController('periodic');
  const mobile = useIsMobile();
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<TaskTemplate | null>(null);

  const q = query.trim().toLowerCase();
  const visible = c.templates.filter(t => matches(t, filter, q));
  const count = (f: string) => c.templates.filter(t => matches(t, f, '')).length;
  const canCreate = c.can('templates');

  const content = c.loading && !c.templates.length ? <TaskLoader mobile={mobile} text="جاري تحميل المهام الدورية..." />
    : c.error ? (
      <div className="tk-state">
        <Repeat size={30} /><p>{c.error}</p>
        <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
      </div>
    ) : c.templates.length === 0 ? (
      <div className="tk-state big">
        <Repeat size={34} />
        <strong>لا توجد مهام دورية بعد</strong>
        <p>المهمة الدورية تتكرر حسب جدول (كتقرير أسبوعي)، وتُنشئ موعدها القادم في صفحة المهام تلقائياً.</p>
        {canCreate && <button type="button" className="tk-btn primary" onClick={() => c.openTemplateForm()}><Plus size={17} />مهمة دورية جديدة</button>}
      </div>
    ) : visible.length === 0 ? (
      <div className="tk-state"><Inbox size={32} /><p>لا توجد مهام دورية بهذه التصفية</p></div>
    ) : (
      <div className={mobile ? 'tk-base-list' : 'tk-base-grid'}>
        {visible.map(t => (mobile
          ? <MobileBaseCard key={t.id} c={c} t={t} onDelete={setToDelete} />
          : <BaseCard key={t.id} c={c} t={t} onDelete={setToDelete} />))}
      </div>
    );

  const deleteDialog = toDelete && (
    <TaskPanel
      mobile={mobile}
      sheet
      size="sm"
      layer={2}
      title="حذف المهمة الدورية"
      onClose={() => setToDelete(null)}
      footer={(
        <>
          <button type="button" className="tk-btn ghost" onClick={() => setToDelete(null)}>إلغاء</button>
          <button type="button" className="tk-btn danger" onClick={() => { c.deleteTemplate(toDelete); setToDelete(null); }}><Trash2 size={17} />حذف</button>
        </>
      )}
    >
      <p className="tk-text">تُحذف «{toDelete.title}» ولن تُنشأ منها مهام جديدة. موعدها القادم الذي لم يبدأ يُلغى، والمهام الجارية أو المنجزة تبقى.</p>
    </TaskPanel>
  );

  if (mobile) {
    return (
      <div className="tk-mpage tk-scope">
        <MobileAppBar title="المهام الدورية" />

        <section className="tk-hero">
          <div className="tk-hero-top">
            <span className="tk-hero-icon"><Repeat size={26} /></span>
            <div>
              <small>المهام الدورية</small>
              <strong>{c.templates.length}</strong>
            </div>
          </div>
          <div className="tk-hero-tiles tv-hero-tiles" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {[
              { label: 'مفعلة', v: count('active'), icon: Power, tone: 'green' },
              { label: 'متوقفة', v: count('stopped'), icon: PowerOff, tone: 'slate' },
              { label: 'مع الأحداث', v: count('event'), icon: Zap, tone: 'orange' },
            ].map(t => (
              <div key={t.label} className={`tone-${t.tone}`}>
                <t.icon size={14} />
                <strong>{t.v}</strong>
                <small>{t.label}</small>
              </div>
            ))}
          </div>
        </section>

        <div className="tk-toolbar">
          <label className="tk-search">
            <Search size={17} />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالعنوان أو المكلف..." />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
          </label>
          <MobileSelect
            label="التصفية"
            icon={Filter}
            value={filter || 'all'}
            options={FILTERS.map(f => ({ value: f.value || 'all', label: f.label, hint: String(count(f.value)) }))}
            onChange={v => setFilter(v === 'all' ? '' : v)}
            renderTrigger={open => (
              <button type="button" className={`tk-filter-btn ${filter ? 'active' : ''}`} onClick={open}>
                <Filter size={15} />
                <span><small>التصفية</small><strong>{FILTERS.find(f => f.value === filter)?.label || 'الكل'}</strong></span>
                <ChevronDown size={15} />
              </button>
            )}
          />
        </div>

        {content}

        {canCreate && (
          <button type="button" className="tk-fab" onClick={() => c.openTemplateForm()} aria-label="مهمة دورية جديدة">
            <Plus size={22} strokeWidth={2.5} />
          </button>
        )}

        {deleteDialog}
        <TaskOverlays c={c} mobile />
      </div>
    );
  }

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <div className="search-box">
          <Search size={18} />
          <input type="text" className="search-input" placeholder="ابحث بالعنوان أو المكلف..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <CustomDropdown
          options={FILTERS.map(f => ({ value: f.value || 'all', label: `${f.label} (${count(f.value)})` }))}
          value={filter || 'all'}
          onChange={v => setFilter(v === 'all' ? '' : v)}
        />
        {canCreate && <button type="button" className="btn-primary" onClick={() => c.openTemplateForm()}><Plus size={18} />مهمة دورية جديدة</button>}
      </div>

      {content}

      {deleteDialog}
      <TaskOverlays c={c} mobile={false} />
    </div>
  );
};
