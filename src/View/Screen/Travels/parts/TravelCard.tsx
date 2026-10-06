import React from 'react';
import { Bus, Users, Briefcase, Trophy, Layers, MapPin, ChevronLeft } from 'lucide-react';
import { initials } from '../../Tasks/taskUtils';
import { countdownText, dateTile, durationText, MY_ROLE_LABEL, shortDate, STATUS_META, statusOf, timeOf, type Travel } from '../travelUtils';

/** Calendar tile of the departure day */
export const DateTile: React.FC<{ at: string | null; big?: boolean }> = ({ at, big }) => {
  const d = dateTile(at);
  return (
    <span className={`tv-tile ${big ? 'big' : ''}`} aria-hidden="true">
      <small>{d?.month || '—'}</small>
      <b>{d?.day || '--'}</b>
      <em>{d?.weekday || ''}</em>
    </span>
  );
};

/** Departure → return, with the bus on the way */
export const RouteLine: React.FC<{ travel: Travel; big?: boolean }> = ({ travel: t, big }) => (
  <div className={`tv-line ${big ? 'big' : ''}`}>
    <div className="tv-line-end">
      <small>الانطلاق</small>
      <strong dir="ltr">{timeOf(t.departure_time) || '--:--'}</strong>
      <em>{big ? shortDate(t.departure_time) : t.departure_location || '—'}</em>
      {big && t.departure_location && <em className="tv-line-place"><MapPin size={11} />{t.departure_location}</em>}
    </div>
    <div className="tv-line-track" aria-hidden="true">
      <i />
      <span><Bus size={big ? 18 : 15} /></span>
      <i />
      {durationText(t) && <small>{durationText(t)}</small>}
    </div>
    <div className="tv-line-end end">
      <small>العودة</small>
      <strong dir="ltr">{timeOf(t.return_time) || '--:--'}</strong>
      <em>{t.return_time ? shortDate(t.return_time) : 'غير محددة'}</em>
      {big && <em className="tv-line-place"><MapPin size={11} />{t.destination}</em>}
    </div>
  </div>
);

/**
 * One trip, as a ticket: date tile, destination, route line, then the delegation in short.
 * `compact` (phones): only the date, the destination, the reason and the category.
 */
export const TravelCard: React.FC<{ travel: Travel; onOpen: (t: Travel) => void; compact?: boolean }> = ({ travel: t, onOpen, compact }) => {
  const status = statusOf(t);
  const meta = STATUS_META[status];
  const players = t.players.length || t.players_count || 0;
  const open = () => onOpen(t);

  if (compact) {
    return (
      <article className={`tv-ticket compact tone-${meta.tone} ${status === 'done' ? 'done' : ''}`} role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
        <DateTile at={t.departure_time} />
        <div className="tv-ticket-title">
          <h3>{t.destination}</h3>
          {(t.travel_reason || t.match) && <span className="tv-compact-reason">{t.travel_reason || t.match?.title}</span>}
          <span className="tv-compact-team"><Layers size={13} />{t.team_name || 'بدون فئة'}</span>
          {t.my_role && <span className="tk-badge soft tone-orange tv-my-role">{MY_ROLE_LABEL[t.my_role]}</span>}
        </div>
        <ChevronLeft size={18} className="tv-compact-go" aria-hidden="true" />
      </article>
    );
  }

  return (
    <article className={`tv-ticket tone-${meta.tone} ${status === 'done' ? 'done' : ''}`} role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
      <div className="tv-ticket-head">
        <DateTile at={t.departure_time} />
        <div className="tv-ticket-title">
          <div className="tv-ticket-badges">
            <span className={`tk-badge tone-${meta.tone}`}>{status === 'upcoming' ? countdownText(t) : meta.label}</span>
            {t.team_name && <span className="tk-badge soft tone-blue"><Layers size={11} />{t.team_name}</span>}
            {t.my_role && <span className="tk-badge soft tone-orange">{MY_ROLE_LABEL[t.my_role]}</span>}
          </div>
          <h3>{t.destination}</h3>
          {(t.match || t.travel_reason) && (
            <p>{t.match ? <><Trophy size={13} />{t.match.title}</> : t.travel_reason}</p>
          )}
        </div>
      </div>

      <RouteLine travel={t} />

      <div className="tv-ticket-foot">
        <span className="tv-chip"><Users size={13} />{players} لاعب</span>
        <span className="tv-chip"><Briefcase size={13} />{t.staff.length} طاقم</span>
        {t.transport_method && <span className="tv-chip"><Bus size={13} />{t.transport_method}</span>}
        <span className="tv-head-person" title="رئيس الوفد">
          {t.head_of_delegation_name ? (
            <>
              <span className="tk-avatar xs">{initials(t.head_of_delegation_name)}</span>
              <span>{t.head_of_delegation_name}</span>
            </>
          ) : <span className="tv-muted">بدون رئيس وفد</span>}
        </span>
      </div>
    </article>
  );
};
