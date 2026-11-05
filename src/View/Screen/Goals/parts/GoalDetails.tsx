import React from 'react';
import { Target, UserRound, CalendarRange, CalendarClock, Pencil } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { dateText, initials } from '../../../shared/dates';
import type { GoalsController } from '../useGoals';
import type { Goal } from '../goalUtils';

/** One goal in full: the goal, its season, the person responsible for it and when it was added (both layouts) */
export const GoalDetails: React.FC<{ c: GoalsController; goal: Goal; mobile: boolean }> = ({ c, goal: g, mobile }) => (
  <SidePanel
    mobile={mobile}
    icon={Target}
    title="تفاصيل الهدف"
    onClose={c.closeGoal}
    footer={(
      <>
        {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeGoal}>إغلاق</button>}
        {c.can('edit') && (
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={() => { c.closeGoal(); c.openForm(g); }}>
            <Pencil size={17} />تعديل
          </button>
        )}
      </>
    )}
  >
    <div className="gl-details">
      <section className="tk-card-box">
        <h3><Target size={16} />الهدف</h3>
        <p className="gl-details-goal">{g.goal}</p>
      </section>

      <div className="gl-details-facts">
        <section className="tk-card-box">
          <h3><UserRound size={16} />المكلّف</h3>
          {g.user ? (
            <div className="tk-person">
              <span className="tk-avatar">{initials(g.user.name)}</span>
              <span><strong>{g.user.name}</strong></span>
            </div>
          ) : <p className="tk-muted">—</p>}
        </section>
        <section className="tk-card-box">
          <h3><CalendarRange size={16} />الموسم</h3>
          <p className="gl-details-season" dir="ltr">{g.season || '—'}</p>
        </section>
      </div>

      {g.created_at && (
        <p className="tk-muted gl-details-date"><CalendarClock size={13} />{dateText(g.created_at)}</p>
      )}
    </div>
  </SidePanel>
);
