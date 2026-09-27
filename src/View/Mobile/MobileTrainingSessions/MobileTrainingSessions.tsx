import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, ClipboardCheck, Dumbbell, Eye, Radio, Users, Filter, ChevronDown } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect } from '../widgets/MobileSelect';
import { useUrlDetails } from '../widgets/useUrlDetails';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import type { useTrainingSessionsController } from '../../Screen/TrainingSessions/TrainingSessionsController';
import type { TrainingSessionModel } from '../../Screen/TrainingSessions/TrainingSessionDialog';
import {
  STATUS_LABELS, STATUS_TONE, computedStatus, dayOf, startOf, endOf, durationOf, durationText, dayLabel,
  daysFromToday, countdownText, attendanceRate, useNow,
} from './sessionUtils';
import { MobileSessionDetails } from './MobileSessionDetails';
import { MobileSessionForm } from './MobileSessionForm';
import './MobileTrainingSessions.css';

interface MobileTrainingSessionsProps {
  controller: ReturnType<typeof useTrainingSessionsController>;
}

type Period = 'upcoming' | 'past';

const attendancePath = (s: TrainingSessionModel) => `/training-sessions/${s.id}/attendance`;

// Phone version of the training sessions page: next session, filters, sessions grouped by day
export const MobileTrainingSessions: React.FC<MobileTrainingSessionsProps> = ({ controller }) => {
  const navigate = useNavigate();
  const now = useNow();
  const [period, setPeriod] = useState<Period>('upcoming');
  const [detailsId, setDetailsId] = useUrlDetails('session');
  const { sessions, teams } = controller;

  const isPast = (s: TrainingSessionModel) => daysFromToday(dayOf(s)) < 0;
  const upcoming = sessions.filter(s => !isPast(s)).sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
  const past = sessions.filter(isPast).sort((a, b) => startOf(b).getTime() - startOf(a).getTime());
  const list = period === 'upcoming' ? upcoming : past;

  // Live session first, otherwise the next one that is not cancelled
  const next = upcoming.find(s => computedStatus(s, now) === 'جارية')
    || upcoming.find(s => computedStatus(s, now) === 'مجدولة');

  const rates = sessions.map(attendanceRate).filter((r): r is number => r !== null);
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;
  const done = sessions.filter(s => computedStatus(s, now) === 'مكتملة').length;

  // Sessions of the same day under one heading
  const groups: { day: string; items: TrainingSessionModel[] }[] = [];
  list.forEach(s => {
    const day = dayOf(s);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(s);
    else groups.push({ day, items: [s] });
  });

  const detailsSession = detailsId !== null ? sessions.find(s => String(s.id) === detailsId) : undefined;

  const menuItems = (s: TrainingSessionModel): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(s.id ?? null) },
    { key: 'attendance', label: 'تسجيل الحضور', icon: ClipboardCheck, color: '#f97316', onClick: () => navigate(attendancePath(s)) },
    { key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => controller.openEditDialog(s) },
    { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => controller.handleDeleteSession(s.id) },
  ];

  const teamOptions = [{ value: '', label: 'كل الفئات' }, ...teams.map(t => ({ value: String(t.id), label: t.name as string }))];
  const selectedTeam = teams.find(t => String(t.id) === controller.selectedTeamId);

  return (
    <div className="mts-page">
      <MobileAppBar title="حصص التدريب" />

      {/* Next session */}
      {!controller.isLoading && (
        <section className={`mts-hero ${next && computedStatus(next, now) === 'جارية' ? 'live' : ''}`}>
          {next ? (
            <>
              <div className="mts-hero-top">
                <span className="mts-hero-tag">
                  {computedStatus(next, now) === 'جارية'
                    ? <><Radio size={14} /> جارية الآن</>
                    : <><Clock size={14} /> الحصة القادمة · {countdownText(startOf(next), now)}</>}
                </span>
              </div>
              <button type="button" className="mts-hero-main" onClick={() => setDetailsId(next.id ?? null)}>
                <span className="mts-hero-date">
                  <small>{dayLabel(dayOf(next))}</small>
                  <strong dir="ltr">{next.start}</strong>
                </span>
                <span className="mts-hero-text">
                  <strong>{next.team_name || 'بدون فئة'}</strong>
                  <span><MapPin size={13} /> {next.location || '—'}</span>
                  <span><Clock size={13} /> <bdi dir="ltr">{next.start} – {next.end}</bdi></span>
                </span>
              </button>
              {computedStatus(next, now) === 'جارية' && (
                <div className="mts-live-bar">
                  <div style={{ width: `${Math.min(100, Math.max(0, ((now.getTime() - startOf(next).getTime()) / (endOf(next).getTime() - startOf(next).getTime())) * 100))}%` }} />
                </div>
              )}
              <button type="button" className="mts-hero-btn" onClick={() => navigate(attendancePath(next))}>
                <ClipboardCheck size={17} /> تسجيل الحضور
              </button>
            </>
          ) : (
            <div className="mts-hero-empty">
              <Dumbbell size={26} />
              <span>لا توجد حصة قادمة مبرمجة</span>
            </div>
          )}

          <div className="mts-stats">
            <div><strong>{upcoming.length}</strong><small>قادمة</small></div>
            <div><strong>{done}</strong><small>مكتملة</small></div>
            <div><strong>{avgRate !== null ? `${avgRate}%` : '—'}</strong><small>معدل الحضور</small></div>
          </div>
        </section>
      )}

      {/* Category filter: searchable list (reloads from the server, like the desktop dropdown) */}
      {teams.length > 0 && (
        <MobileSelect
          label="تصفية حسب الفئة"
          icon={Users}
          value={controller.selectedTeamId}
          options={teamOptions}
          onChange={controller.setSelectedTeamId}
          searchable
          renderTrigger={open => (
            <button type="button" className={`mts-filter ${selectedTeam ? 'active' : ''}`} onClick={open}>
              <Filter size={17} />
              <span>
                <small>الفئة</small>
                <strong>{selectedTeam?.name || 'كل الفئات'}</strong>
              </span>
              <ChevronDown size={18} />
            </button>
          )}
        />
      )}

      <div className="mts-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={period === 'upcoming'} className={period === 'upcoming' ? 'active' : ''} onClick={() => setPeriod('upcoming')}>
          القادمة <span>{upcoming.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={period === 'past'} className={period === 'past' ? 'active' : ''} onClick={() => setPeriod('past')}>
          السابقة <span>{past.length}</span>
        </button>
      </div>

      {controller.isLoading ? (
        <MobileLoader text="جاري تحميل الحصص..." />
      ) : list.length === 0 ? (
        <div className="mts-empty">
          <span className="mts-empty-icon"><Calendar size={36} /></span>
          <strong>{period === 'upcoming' ? 'لا توجد حصص قادمة' : 'لا توجد حصص سابقة'}</strong>
          <p>{period === 'upcoming' ? 'أضف حصة تدريبية جديدة بالزر +' : 'ستظهر هنا الحصص بعد انقضاء تاريخها.'}</p>
        </div>
      ) : (
        <div className="mts-list">
          {groups.map(group => (
            <section key={group.day} className="mts-day">
              <h3>{dayLabel(group.day)} <span>{group.items.length}</span></h3>
              {group.items.map(s => {
                const status = computedStatus(s, now);
                const minutes = durationOf(s.start, s.end);
                const rate = attendanceRate(s);
                const open = () => setDetailsId(s.id ?? null);
                return (
                  <article
                    key={s.id}
                    className={`mts-card tone-${STATUS_TONE[status] || 'scheduled'}`}
                    role="button"
                    tabIndex={0}
                    onClick={open}
                    onKeyDown={e => { if (e.key === 'Enter') open(); }}
                  >
                    <span className="mts-time">
                      <strong dir="ltr">{s.start}</strong>
                      <small dir="ltr">{s.end}</small>
                      {minutes && <em>{durationText(minutes)}</em>}
                    </span>
                    <span className="mts-card-body">
                      <span className="mts-card-head">
                        <strong>{s.team_name || 'بدون فئة'}</strong>
                        <span className="mts-status"><i />{STATUS_LABELS[status] || status}</span>
                      </span>
                      <span className="mts-meta"><MapPin size={13} /> {s.location || '—'}</span>
                      {s.attendance_stats && s.attendance_stats.total > 0 ? (
                        <span className="mts-att">
                          <span className="mts-att-bar"><span style={{ width: `${rate}%` }} /></span>
                          <small><Users size={12} /> {s.attendance_stats.present}/{s.attendance_stats.total}</small>
                        </span>
                      ) : (
                        <span className="mts-meta muted"><Users size={13} /> لم يُسجل الحضور بعد</span>
                      )}
                    </span>
                    <MobileRowMenu items={menuItems(s)} label="إجراءات الحصة" />
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}

      <button type="button" className="mts-fab" onClick={controller.openAddDialog} aria-label="إضافة حصة" title="إضافة حصة">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {detailsSession && (
        <MobileSessionDetails
          session={detailsSession}
          now={now}
          onChangeStatus={status => controller.handleChangeStatus(detailsSession.id, status)}
          onAttendance={() => navigate(attendancePath(detailsSession))}
          onEdit={() => controller.openEditDialog(detailsSession)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {controller.isDialogOpen && (
        <MobileSessionForm
          key={controller.sessionToEdit?.id ?? 'new'}
          session={controller.sessionToEdit}
          teams={teams}
          defaultTeamId={controller.selectedTeamId}
          onSave={controller.handleSaveSession}
          onClose={controller.closeDialog}
        />
      )}
    </div>
  );
};
