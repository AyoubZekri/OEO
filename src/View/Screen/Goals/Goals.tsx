import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { PageLoader } from '../../shared/PageLoader';
import { MobileGoals } from '../../Mobile/MobileGoals/MobileGoals';
import { useGoals } from './useGoals';
import { GoalOverlays } from './parts/GoalOverlays';
import { GoalCard } from './parts/GoalCard';
import { filterGoals } from './goalUtils';
import '../../shared/kit.css';
import '../Tasks/Tasks.css';
import './Goals.css';
import { StateIcon } from '../../widget/StateIcon';

// The general goals as cards: each goal with its season and the user responsible for it; a search on top
export const Goals: React.FC = () => {
  const c = useGoals();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');

  if (isMobile) return <MobileGoals c={c} />;

  const visible = filterGoals(c.goals, query);

  return (
    <div className="tk-page tk-scope">
      <div className="tk-actions-row">
        <TopbarSearch value={query} onChange={v => setQuery(v)} placeholder="ابحث بالهدف أو المكلّف" />
        {c.can('add') && <button type="button" className="btn-primary" onClick={() => c.openForm()}><Plus size={18} />هدف جديد</button>}
      </div>

      {c.loading && !c.goals.length ? <PageLoader mobile={false} text="جاري تحميل الأهداف..." />
        : c.error ? (
          <div className="tk-state">
            <StateIcon failed />
            <button type="button" className="tk-btn ghost sm" onClick={() => c.reload()}><RefreshCw size={15} />إعادة المحاولة</button>
          </div>
        ) : visible.length === 0 ? (
          <StateIcon />
        ) : (
          <div className="gl-cards">
            {visible.map(g => <GoalCard key={g.id} g={g} c={c} mobile={false} />)}
          </div>
        )}

      <GoalOverlays c={c} mobile={false} />
    </div>
  );
};
