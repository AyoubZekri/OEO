import React, { useState } from 'react';
import { Plus, Target, Search, X, Inbox, RefreshCw, CalendarRange, Users } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { PageLoader } from '../../shared/PageLoader';
import type { GoalsController } from '../../Screen/Goals/useGoals';
import { GoalOverlays } from '../../Screen/Goals/parts/GoalOverlays';
import { GoalCard } from '../../Screen/Goals/parts/GoalCard';
import { filterGoals, goalUsers, usedSeasons } from '../../Screen/Goals/goalUtils';
import '../../shared/kit.css';
import '../../Screen/Tasks/Tasks.css';
import '../../Screen/Goals/Goals.css';

// Phone version of the general goals page: the count in the hero, the search, the goals as cards
export const MobileGoals: React.FC<{ c: GoalsController }> = ({ c }) => {
  const [query, setQuery] = useState('');

  const seasons = usedSeasons(c.goals);
  const users = goalUsers(c.goals);
  const visible = filterGoals(c.goals, query);

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="الأهداف العامة" />

      <section className="tk-hero">
        <div className="tk-hero-top">
          <span className="tk-hero-icon"><Target size={26} /></span>
          <div>
            <small>الأهداف</small>
            <strong>{c.goals.length}</strong>
          </div>
        </div>
        <div className="tk-hero-tiles gl-hero-tiles">
          {[
            { label: 'المواسم', v: seasons.length, icon: CalendarRange, tone: 'blue' },
            { label: 'المكلّفون', v: users.length, icon: Users, tone: 'green' },
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
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالهدف أو المكلّف..." />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
        </label>
      </div>

      {c.loading && !c.goals.length ? <PageLoader mobile text="جاري تحميل الأهداف..." />
        : c.error ? (
          <div className="tk-state">
            <Target size={30} /><p>{c.error}</p>
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="tk-state"><Inbox size={32} /><p>{c.goals.length ? 'لا توجد أهداف بهذا البحث' : 'لا توجد أهداف بعد'}</p></div>
        ) : (
          <div className="gl-cards">
            {visible.map(g => <GoalCard key={g.id} g={g} c={c} mobile />)}
          </div>
        )}

      {c.can('add') && (
        <button type="button" className="tk-fab" onClick={() => c.openForm()} aria-label="هدف جديد">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <GoalOverlays c={c} mobile />
    </div>
  );
};
