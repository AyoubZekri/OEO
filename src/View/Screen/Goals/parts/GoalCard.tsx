import React from 'react';
import { Target, UserRound } from 'lucide-react';
import { ActionsMenu } from '../../../widget/ActionsMenu';
import { MobileRowMenu } from '../../../Mobile/widgets/MobileRowMenu';
import { initials } from '../../../shared/dates';
import type { GoalsController } from '../useGoals';
import type { Goal } from '../goalUtils';

/** A goal as a card: its icon, season and ⋮ on top, the goal itself, then the user responsible for it; a tap opens its details */
export const GoalCard: React.FC<{ g: Goal; c: GoalsController; mobile: boolean }> = ({ g, c, mobile }) => {
  const menu = c.actionsFor(g);
  return (
    <article
      className="gl-card gl-card-open"
      role="button"
      tabIndex={0}
      onClick={() => c.openGoal(g)}
      onKeyDown={e => { if (e.key === 'Enter') c.openGoal(g); }}
    >
      <header className="gl-card-top">
        <span className="gl-card-icon"><Target size={20} /></span>
        <span className="gl-season" dir="ltr">{g.season}</span>
        {menu.length > 0 && (
          <span className="gl-card-menu" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            {mobile ? <MobileRowMenu items={menu} label="إجراءات الهدف" /> : <ActionsMenu label="إجراءات الهدف" items={menu} />}
          </span>
        )}
      </header>

      <p className="gl-card-goal">{g.goal}</p>

      <footer className="gl-card-who">
        <i aria-hidden="true">{g.user ? initials(g.user.name) : <UserRound size={14} />}</i>
        <b>{g.user?.name || '—'}</b>
      </footer>
    </article>
  );
};
