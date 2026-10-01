import React, { useState } from 'react';
import {
  MapPin, Bus, BedDouble, Trophy, Clock, FileText, Pencil, Trash2, Navigation, UtensilsCrossed, MessagesSquare, Flag,
  Home, PlaneLanding, Shirt, Briefcase, Layers, CalendarRange, Crown, CalendarClock,
} from 'lucide-react';
import { TaskPanel } from '../../Tasks/parts/TaskPanel';
import { dateText, initials } from '../../Tasks/taskUtils';
import { TYPE_LABELS } from '../../../Mobile/MobileMembers/memberLabels';
import type { TravelsController } from '../useTravelsController';
import { countdownText, durationText, SCHEDULE, STATUS_META, statusOf, type Travel, type TravelPerson } from '../travelUtils';
import { DateTile, RouteLine } from './TravelCard';

const SCHEDULE_ICONS: Record<string, typeof Clock> = {
  schedule_departure: Navigation,
  schedule_arrival: PlaneLanding,
  schedule_meal: UtensilsCrossed,
  schedule_tech_meeting: MessagesSquare,
  schedule_match: Flag,
  schedule_return: Home,
};

/** Members as name tags with their initials (and position for the staff) */
const PeopleTags: React.FC<{ people: TravelPerson[]; showType?: boolean }> = ({ people, showType }) => (
  <div className="tv-tags">
    {people.map(p => (
      <span key={p.id} className="tv-tag">
        <span className="tk-avatar xs">{initials(p.name)}</span>
        <span className="tv-tag-text">
          <b>{p.name}</b>
          {showType && p.type && <small>{TYPE_LABELS[p.type] || p.type}</small>}
        </span>
      </span>
    ))}
  </div>
);

/** A trip: ticket head (date, destination, route), four counters, then the schedule and the delegation next to the trip facts */
export const TravelDetails: React.FC<{ c: TravelsController; travel: Travel; mobile: boolean }> = ({ c, travel: t, mobile }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = statusOf(t);
  const meta = STATUS_META[status];
  const schedule = SCHEDULE.filter(s => t[s.key]);
  const players = t.players.length || t.players_count || 0;

  const footer = (
    <div className="tk-actions">
      {c.can('edit') && <button type="button" className="tk-btn ghost" onClick={() => c.openForm(t)}><Pencil size={16} />تعديل</button>}
      {c.can('delete') && <button type="button" className="tk-btn ghost danger-text" onClick={() => setConfirmDelete(true)}><Trash2 size={16} />حذف</button>}
      {!mobile && <button type="button" className="btn-cancel tk-dlg-btn tk-actions-side" onClick={c.closeTravel}>إغلاق</button>}
    </div>
  );
  const hasFooter = !mobile || c.can('edit') || c.can('delete');

  const stats = [
    { icon: Layers, label: 'الفئة', value: t.team_name || '—' },
    { icon: Shirt, label: 'اللاعبون', value: players },
    { icon: Briefcase, label: 'الطاقم', value: t.staff.length },
    { icon: CalendarRange, label: 'المدة', value: durationText(t) || '—' },
  ];

  return (
    <TaskPanel mobile={mobile} size="lg" icon={MapPin} title="تفاصيل التنقل" onClose={c.closeTravel} footer={hasFooter ? footer : undefined}>
      <div className="tk-view tv-view">
        {/* Ticket head */}
        <section className="tv-hero-card">
          <div className="tv-hero-top">
            <DateTile at={t.departure_time} big />
            <div className="tv-hero-title">
              <div className="tv-ticket-badges">
                <span className={`tk-badge tone-${meta.tone}`}>{status === 'upcoming' ? `${meta.label} · ${countdownText(t)}` : meta.label}</span>
              </div>
              <h2>{t.destination}</h2>
              {(t.match || t.travel_reason) && (
                <p>{t.match ? <><Trophy size={14} />{t.match.title}</> : t.travel_reason}</p>
              )}
            </div>
          </div>
          <RouteLine travel={t} big />
        </section>

        <div className="tv-stats">
          {stats.map(s => (
            <div key={s.label}>
              <span className="tv-stat-icon"><s.icon size={16} /></span>
              <span><small>{s.label}</small><b>{s.value}</b></span>
            </div>
          ))}
        </div>

        <div className="tk-view-grid">
          <div className="tk-view-main">
            <section className="tk-card-box">
              <h3><Clock size={16} />البرنامج الزمني</h3>
              {schedule.length === 0 ? <p className="tk-muted">لم يُحدد البرنامج بعد</p> : (
                <ol className="tv-schedule">
                  {schedule.map(s => {
                    const Icon = SCHEDULE_ICONS[s.key as string] || Clock;
                    return (
                      <li key={s.key}>
                        <b dir="ltr">{t[s.key] as string}</b>
                        <span className="tv-schedule-dot" aria-hidden="true"><Icon size={14} /></span>
                        <span>{s.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="tk-card-box">
              <h3><Shirt size={16} />اللاعبون <b>{players}</b></h3>
              {t.players.length ? <PeopleTags people={t.players} />
                : <p className="tk-muted">{t.players_count ? `${t.players_count} لاعب (لم تُحدد الأسماء)` : 'لم يُحدد اللاعبون'}</p>}
            </section>

            <section className="tk-card-box">
              <h3><Briefcase size={16} />الطاقم المرافق <b>{t.staff.length}</b></h3>
              {t.staff.length ? <PeopleTags people={t.staff} showType />
                : t.staff_details ? <p className="tk-text">{t.staff_details}</p> : <p className="tk-muted">لم يُحدد الطاقم</p>}
            </section>
          </div>

          <aside className="tk-view-side">
            <section className="tk-card-box tv-leader">
              <h3><Crown size={16} />رئيس الوفد</h3>
              {t.head_of_delegation_name ? (
                <div className="tk-person">
                  <span className="tk-avatar">{initials(t.head_of_delegation_name)}</span>
                  <span><strong>{t.head_of_delegation_name}</strong></span>
                </div>
              ) : <p className="tk-muted">لم يُحدد</p>}
            </section>

            <section className="tk-card-box">
              <h3><Bus size={16} />التنقل</h3>
              <dl className="tk-facts">
                <div><dt><Navigation size={13} />الانطلاق من</dt><dd className="tv-dd-text">{t.departure_location || '—'}</dd></div>
                <div><dt><Bus size={13} />وسيلة النقل</dt><dd className="tv-dd-text">{t.transport_method || '—'}</dd></div>
                <div><dt><BedDouble size={13} />الإقامة</dt><dd className="tv-dd-text">{t.accommodation_place || '—'}</dd></div>
              </dl>
            </section>

            {t.match && (
              <div className="tk-linked">
                <span className="tk-linked-icon"><Trophy size={18} /></span>
                <span>
                  <small>المباراة المرتبطة</small>
                  <strong>{t.match.title}</strong>
                  <em>{[dateText(t.match.at), t.match.team, t.match.place].filter(Boolean).join(' · ')}</em>
                </span>
              </div>
            )}

            {t.special_notes && (
              <section className="tk-card-box tv-notes">
                <h3><FileText size={16} />ملاحظات خاصة</h3>
                <p className="tk-text">{t.special_notes}</p>
              </section>
            )}

            {t.created_at && <p className="tk-muted"><CalendarClock size={13} />أضيف في {dateText(t.created_at)}</p>}
          </aside>
        </div>
      </div>

      {confirmDelete && (
        <TaskPanel
          mobile={mobile}
          sheet
          size="sm"
          layer={2}
          title="حذف التنقل"
          onClose={() => setConfirmDelete(false)}
          footer={(
            <>
              <button type="button" className="tk-btn ghost" onClick={() => setConfirmDelete(false)}>إلغاء</button>
              <button type="button" className="tk-btn danger" onClick={() => { setConfirmDelete(false); c.remove(t); }}><Trash2 size={17} />حذف</button>
            </>
          )}
        >
          <p className="tk-text">يُحذف التنقل إلى «{t.destination}» نهائياً مع برنامجه.</p>
        </TaskPanel>
      )}
    </TaskPanel>
  );
};
