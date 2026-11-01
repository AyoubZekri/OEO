import React, { useState } from 'react';
import { Plus, Search, X, RefreshCw } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { PageLoader } from '../../shared/PageLoader';
import type { GoalsController } from '../../Screen/Goals/useGoals';
import { GoalOverlays } from '../../Screen/Goals/parts/GoalOverlays';
import { GoalCard } from '../../Screen/Goals/parts/GoalCard';
import { filterGoals } from '../../Screen/Goals/goalUtils';
import '../../shared/kit.css';
import '../../Screen/Tasks/Tasks.css';
import '../../Screen/Goals/Goals.css';
import { StateIcon } from '../../widget/StateIcon';

// Phone version of the general goals page: the search, the goals as cards
export const MobileGoals: React.FC<{ c: GoalsController }> = ({ c }) => {
  const [query, setQuery] = useState('');

  const visible = filterGoals(c.goals, query);

  return (
    <div className="tk-mpage tk-scope">
      <MobileAppBar title="الأهداف العامة" />

      <div className="tk-toolbar">
        <label className="tk-search">
          <Search size={17} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالهدف أو المكلّف" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
        </label>
      </div>

      {c.loading && !c.goals.length ? <PageLoader mobile text="جاري تحميل الأهداف..." />
        : c.error ? (
          <div className="tk-state">
            <StateIcon failed />
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <StateIcon />
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
