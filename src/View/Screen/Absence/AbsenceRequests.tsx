import React, { useState } from 'react';
import { Plus, Users, FileWarning, History, ClipboardList, Inbox } from 'lucide-react';
import { useCan } from '../../../core/functions/useCan';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { useAbsenceRequestsController } from './AbsenceRequestsController';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { JustificationDialog } from './JustificationDialog';
import { AddAbsenceDialog } from './AddAbsenceDialog';
import { MemberAbsenceHistoryDialog } from './MemberAbsenceHistoryDialog';
import { AbsenceCard } from './AbsenceCard';
import { RejectReasonDialog } from './RejectReasonDialog';
import {
  ABSENCE_TYPES, EVENT_CATEGORIES, kindOf, STATUS_FILTERS, statusOf, countsOf, recordsOf, byDateDesc, memberName, memberRole, memberTeam, initials,
} from './absenceUtils';
import { MobileAbsences } from '../../Mobile/MobileAbsences/MobileAbsences';
import './Absence.css';
import { TopbarSearch } from '../../widget/TopbarSearch';
import { StateIcon } from '../../widget/StateIcon';

/* eslint-disable @typescript-eslint/no-explicit-any -- members come untyped from the API */

const PAGE = 24;

export const AbsenceRequests: React.FC = () => {
  const controller = useAbsenceRequestsController();
  const can = useCan();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [role, setRole] = useState<'' | 'players' | 'staff'>('');
  const [limit, setLimit] = useState(PAGE);

  if (isMobile) return <MobileAbsences c={controller} />;

  const q = query.trim().toLowerCase();
  const pending = controller.absences.filter(a => statusOf(a) === 'pending').sort(byDateDesc);

  const members = controller.members
    .filter((m: any) => (role === 'players' ? m.type === 'player' : role === 'staff' ? m.type !== 'player' : true))
    .filter((m: any) => !q || memberName(m).toLowerCase().includes(q))
    .filter((m: any) => !controller.filterTeamId || String(m.team_id ?? m.team?.id ?? '') === String(controller.filterTeamId));

  const registry = controller.absences
    .filter(a => !type || kindOf(a) === type)
    .filter(a => !q || (a.player_name || '').toLowerCase().includes(q))
    .slice()
    .sort(byDateDesc);

  const cardProps = { onJustify: controller.openJustificationDialog, onDecide: controller.decide, onDelete: controller.handleDelete };

  const tabs = [
    { value: 'members', label: 'الأعضاء', icon: Users, count: controller.members.length },
    { value: 'requests', label: 'الطلبات', icon: Inbox, count: pending.length, alert: pending.length > 0 },
    { value: 'registry', label: 'السجل العام', icon: ClipboardList, count: controller.absences.length },
  ] as const;

  const empty = (icon: typeof FileWarning) => <StateIcon icon={icon} />;

  return (
    <div className="ab-page">
      {/* Title and the add button */}
      <section className="ab-hero">
        <div className="ab-hero-main">
          <span className="ab-hero-icon"><FileWarning size={30} /></span>
          <div>
            <strong className="title">الغيابات والتبريرات</strong>
          </div>
          {can('absences', 'add') && (
            <div className="ab-hero-actions">
              <button type="button" className="ab-add" onClick={() => controller.openAddAbsenceDialog(undefined, false)}>
                <Plus size={18} /> تسجيل حالة
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="ab-tabs" role="tablist">
        {tabs.map(t => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={controller.activeTab === t.value}
            className={controller.activeTab === t.value ? 'on' : ''}
            onClick={() => { controller.setActiveTab(t.value); setLimit(PAGE); }}
          >
            <t.icon size={17} /> {t.label}
            <b className={'alert' in t && t.alert ? 'alert' : ''}>{t.count}</b>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      {controller.activeTab !== 'requests' && (
        <div className="ab-toolbar">
          <TopbarSearch value={query} onChange={v => setQuery(v)} placeholder="ابحث باسم العضو" />

          <div className="ab-selects">
            {controller.activeTab === 'members' ? (
              <div className="ab-select">
                <CustomDropdown
                  value={role}
                  onChange={val => setRole(val as typeof role)}
                  options={[{ value: '', label: 'كل الأعضاء' }, { value: 'players', label: 'اللاعبون' }, { value: 'staff', label: 'الطاقم والإداريون' }]}
                />
              </div>
            ) : (
              <div className="ab-select">
                <CustomDropdown value={type} onChange={val => setType(val)} options={[{ value: '', label: 'كل الأنواع' }, ...ABSENCE_TYPES.map(t => ({ value: t.value, label: t.label }))]} />
              </div>
            )}
            <div className="ab-select">
              <CustomDropdown
                value={controller.filterTeamId}
                onChange={val => controller.setFilterTeamId(val)}
                options={[{ value: '', label: 'كل الفرق' }, ...controller.teams.map((t: any) => ({ value: String(t.id), label: t.name }))]}
              />
            </div>
            {controller.activeTab === 'registry' && (
              <>
                <div className="ab-select">
                  <CustomDropdown
                    value={controller.filterCategory}
                    onChange={val => controller.setFilterCategory(val)}
                    options={[{ value: '', label: 'كل الفعاليات' }, ...EVENT_CATEGORIES.map(c => ({ value: c.value, label: c.value }))]}
                  />
                </div>
                <div className="ab-select">
                  <CustomDropdown
                    value={controller.filterStatus}
                    onChange={val => controller.setFilterStatus(val)}
                    options={STATUS_FILTERS}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Members */}
      {controller.activeTab === 'members' && (
        members.length === 0 ? empty(Users) : (
          <>
            <div className="ab-members">
              {members.slice(0, limit).map((m: any) => {
                const c = countsOf(recordsOf(controller.absences, m.id));
                return (
                  <article key={m.id} className="ab-member">
                    <div className="ab-member-top">
                      <span className="ab-avatar big">{initials(memberName(m))}</span>
                      <div>
                        <strong>{memberName(m)}</strong>
                        <small>{memberRole(m)}{memberTeam(m) ? ` · ${memberTeam(m)}` : ''}</small>
                      </div>
                    </div>
                    <div className="ab-counters">
                      <span className="tone-red"><b>{c.absent}</b> غياب</span>
                      <span className="tone-amber"><b>{c.late}</b> تأخر</span>
                      <span className="tone-orange"><b>{c.leave}</b> مغادرة</span>
                    </div>
                    <div className="ab-member-actions">
                      {can('absences', 'add') && (
                        <button type="button" className="ab-btn soft" onClick={() => controller.openAddAbsenceDialog(m.id)}>
                          <Plus size={15} /> تسجيل
                        </button>
                      )}
                      <button type="button" className="ab-btn" onClick={() => controller.openHistoryDialog(m.id)}>
                        <History size={15} /> السجل {c.total > 0 && <b>{c.total}</b>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {members.length > limit && (
              <button type="button" className="ab-more" onClick={() => setLimit(l => l + PAGE)}>عرض المزيد ({members.length - limit})</button>
            )}
          </>
        )
      )}

      {/* Pending justifications */}
      {controller.activeTab === 'requests' && (
        pending.length === 0 ? empty(Inbox): (
          <div className="ab-grid">
            {pending.map(a => <AbsenceCard key={a.id} absence={a} {...cardProps} />)}
          </div>
        )
      )}

      {/* Registry */}
      {controller.activeTab === 'registry' && (
        controller.isLoading && !controller.absences.length ? empty(ClipboardList) :
          registry.length === 0 ? empty(ClipboardList) : (
            <>
              <div className="ab-grid">
                {registry.slice(0, limit).map(a => <AbsenceCard key={a.id} absence={a} {...cardProps} />)}
              </div>
              {registry.length > limit && (
                <button type="button" className="ab-more" onClick={() => setLimit(l => l + PAGE)}>عرض المزيد ({registry.length - limit})</button>
              )}
            </>
          )
      )}

      {/* The member file first, so add / justify dialogs open on top of it */}
      <MemberAbsenceHistoryDialog
        key={controller.selectedMemberId ?? 'none'}
        isOpen={controller.isHistoryDialogOpen}
        onClose={controller.closeHistoryDialog}
        member={controller.members.find((m: any) => String(m.id) === String(controller.selectedMemberId))}
        absences={controller.selectedMemberId !== null ? recordsOf(controller.absences, controller.selectedMemberId) : []}
        onAdd={() => controller.selectedMemberId !== null && controller.openAddAbsenceDialog(controller.selectedMemberId)}
        {...cardProps}
      />
      <AddAbsenceDialog
        isOpen={controller.isAddAbsenceDialogOpen}
        onClose={controller.closeAddAbsenceDialog}
        onSubmit={controller.handleAddAbsence}
        defaultPlayerId={controller.selectedMemberForAbsenceId}
        isMultiMode={controller.isMultiMode}
        meetings={controller.meetings.map((m: any) => ({ id: String(m.id), topic: m.topic, date: m.date }))}
      />
      <JustificationDialog
        isOpen={controller.isJustificationDialogOpen}
        absence={controller.selectedAbsence}
        onClose={controller.closeJustificationDialog}
        onSubmit={controller.submitJustification}
        withDocument
      />
      {controller.rejecting && (
        <RejectReasonDialog absence={controller.rejecting} onClose={controller.closeReject} onConfirm={controller.confirmReject} />
      )}
    </div>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
