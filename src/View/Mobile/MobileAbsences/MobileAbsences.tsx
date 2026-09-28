import React, { useState } from 'react';
import {
  Plus, Users, UserX, Clock, LogOut, Plane, Hourglass, ShieldCheck, Search, X, FileWarning, Inbox, ClipboardList, ChevronDown,
  Filter, Layers, CalendarRange,
} from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect } from '../widgets/MobileSelect';
import { useCan } from '../../../core/functions/useCan';
import type { useAbsenceRequestsController } from '../../Screen/Absence/AbsenceRequestsController';
import {
  ABSENCE_TYPES, EVENT_CATEGORIES, kindOf, STATUS_FILTERS, statusOf, countsOf, recordsOf, byDateDesc, memberName, memberRole, memberTeam, initials,
} from '../../Screen/Absence/absenceUtils';
import { MobileAbsenceCard } from './MobileAbsenceCard';
import { MobileAbsenceMember } from './MobileAbsenceMember';
import { MobileAbsenceForm } from './MobileAbsenceForm';
import { MobileJustifySheet } from './MobileJustifySheet';
import './MobileAbsences.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- members come untyped from the API */

const PAGE = 20;

// Phone version of the absences page: counters, members with their counters, pending justifications and the full registry
export const MobileAbsences: React.FC<{ c: ReturnType<typeof useAbsenceRequestsController> }> = ({ c }) => {
  const can = useCan();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const s = c.stats;
  const q = query.trim().toLowerCase();
  const pending = c.absences.filter(a => statusOf(a) === 'pending').sort(byDateDesc);
  const members = c.members
    .filter((m: any) => !q || memberName(m).toLowerCase().includes(q))
    .filter((m: any) => !c.filterTeamId || String(m.team_id ?? m.team?.id ?? '') === String(c.filterTeamId));
  const registry = c.absences
    .filter(a => !type || kindOf(a) === type)
    .filter(a => !q || (a.player_name || '').toLowerCase().includes(q))
    .slice()
    .sort(byDateDesc);

  const cardProps = {
    onJustify: c.openJustificationDialog,
    onDecide: (id: number, status: 'مقبول' | 'مرفوض') => c.handleUpdateJustification(id, status),
    onDelete: c.handleDelete,
  };
  const member = c.selectedMemberId !== null ? c.members.find((m: any) => String(m.id) === String(c.selectedMemberId)) : undefined;
  const team = c.teams.find((t: any) => String(t.id) === String(c.filterTeamId));

  const tabs = [
    { value: 'members', label: 'الأعضاء', icon: Users, count: c.members.length },
    { value: 'requests', label: 'التبريرات', icon: Inbox, count: pending.length },
    { value: 'registry', label: 'السجل', icon: ClipboardList, count: c.absences.length },
  ] as const;

  const pick = (label: string, icon: React.ComponentType<{ size?: number }>, value: string, options: { value: string; label: string }[], onChange: (v: string) => void) => (
    <MobileSelect
      label={label}
      icon={icon}
      value={value}
      options={options}
      onChange={onChange}
      renderTrigger={open => (
        <button type="button" className={`mab-filter ${value ? 'active' : ''}`} onClick={open}>
          {React.createElement(icon, { size: 15 })}
          <span><small>{label}</small><strong>{options.find(o => o.value === value)?.label || 'الكل'}</strong></span>
          <ChevronDown size={15} />
        </button>
      )}
    />
  );

  return (
    <div className="mab-page">
      <MobileAppBar title="الغيابات والتبريرات" />

      <section className="mab-hero">
        <div className="mab-hero-top">
          <span className="mab-hero-icon"><FileWarning size={26} /></span>
          <div>
            <small>سجلات الغياب</small>
            <strong>{s.total}</strong>
          </div>
        </div>
        <div className="mab-tiles">
          {[
            { k: 'a', label: 'غياب', v: s.absent, icon: UserX, tone: 'red' },
            { k: 'l', label: 'تأخر', v: s.late, icon: Clock, tone: 'amber' },
            { k: 'g', label: 'مغادرة', v: s.leave, icon: LogOut, tone: 'orange' },
            { k: 'r', label: 'عطلة', v: s.request, icon: Plane, tone: 'violet' },
            { k: 'p', label: 'قيد الدراسة', v: s.pending, icon: Hourglass, tone: 'blue' },
            { k: 'j', label: 'مبررة', v: s.justified, icon: ShieldCheck, tone: 'green' },
          ].map(t => (
            <div key={t.k} className={`tone-${t.tone}`}>
              <t.icon size={14} />
              <strong>{t.v}</strong>
              <small>{t.label}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="mab-tabs" role="tablist">
        {tabs.map(t => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={c.activeTab === t.value}
            className={c.activeTab === t.value ? 'on' : ''}
            onClick={() => { c.setActiveTab(t.value); setLimit(PAGE); }}
          >
            <t.icon size={15} />
            <span>{t.label}</span>
            <b className={t.value === 'requests' && t.count > 0 ? 'alert' : ''}>{t.count}</b>
          </button>
        ))}
      </div>

      {c.activeTab !== 'requests' && (
        <>
          <label className="mab-search">
            <Search size={17} />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم العضو..." />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={15} /></button>}
          </label>
          <div className="mab-filters">
            {pick('الفريق', Users, c.filterTeamId, [{ value: '', label: 'كل الفرق' }, ...c.teams.map((t: any) => ({ value: String(t.id), label: t.name }))], c.setFilterTeamId)}
            {c.activeTab === 'registry' && (
              <>
                {pick('النوع', Layers, type, [{ value: '', label: 'كل الأنواع' }, ...ABSENCE_TYPES.map(t => ({ value: t.value, label: t.label }))], setType)}
                {pick('الفعالية', CalendarRange, c.filterCategory, [{ value: '', label: 'كل الفعاليات' }, ...EVENT_CATEGORIES.map(x => ({ value: x.value, label: x.value }))], c.setFilterCategory)}
                {pick('التبرير', Filter, c.filterStatus, STATUS_FILTERS, c.setFilterStatus)}
              </>
            )}
          </div>
          {team && c.activeTab === 'members' && <p className="mab-note">أعضاء فريق {team.name}</p>}
        </>
      )}

      {/* Members */}
      {c.activeTab === 'members' && (
        members.length === 0 ? (
          c.members.length ? <p className="mab-empty">لا يوجد أعضاء بهذا البحث</p> : <MobileLoader text="جاري تحميل الأعضاء..." />
        ) : (
          <div className="mab-list">
            {members.slice(0, limit).map((m: any) => {
              const cnt = countsOf(recordsOf(c.absences, m.id));
              const open = () => c.openHistoryDialog(m.id);
              return (
                <article key={m.id} className="mab-member" role="button" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
                  <div className="mab-member-top">
                    <span className="mab-avatar">{initials(memberName(m))}</span>
                    <span className="mab-card-text">
                      <strong>{memberName(m)}</strong>
                      <small>{memberRole(m)}{memberTeam(m) ? ` · ${memberTeam(m)}` : ''}</small>
                    </span>
                    {can('absences', 'add') && (
                      <button type="button" className="mab-quick" onClick={e => { e.stopPropagation(); c.openAddAbsenceDialog(m.id); }} aria-label="تسجيل حالة">
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                  <div className="mab-counts">
                    <span className="tone-red"><b>{cnt.absent}</b> غياب</span>
                    <span className="tone-amber"><b>{cnt.late}</b> تأخر</span>
                    <span className="tone-orange"><b>{cnt.leave}</b> مغادرة</span>
                    {cnt.pending > 0 ? (
                      <em className="blue"><Hourglass size={11} /> {cnt.pending} قيد الدراسة</em>
                    ) : cnt.unjustified > 0 ? (
                      <em className="red"><UserX size={11} /> {cnt.unjustified} بدون تبرير</em>
                    ) : (
                      <em className="green"><ShieldCheck size={11} /> لا غياب بدون تبرير</em>
                    )}
                  </div>
                </article>
              );
            })}
            {members.length > limit && <button type="button" className="mab-more" onClick={() => setLimit(l => l + PAGE)}>عرض المزيد ({members.length - limit})</button>}
          </div>
        )
      )}

      {/* Pending justifications */}
      {c.activeTab === 'requests' && (
        pending.length === 0 ? (
          <div className="mab-empty big"><Inbox size={34} /><strong>لا توجد طلبات تبرير معلقة</strong></div>
        ) : (
          <div className="mab-list">{pending.map(a => <MobileAbsenceCard key={a.id} absence={a} {...cardProps} />)}</div>
        )
      )}

      {/* Registry */}
      {c.activeTab === 'registry' && (
        c.isLoading && !c.absences.length ? <MobileLoader text="جاري تحميل السجل..." /> :
          registry.length === 0 ? (
            <div className="mab-empty big"><ClipboardList size={34} /><strong>لا توجد سجلات بهذه التصفية</strong></div>
          ) : (
            <div className="mab-list">
              {registry.slice(0, limit).map(a => <MobileAbsenceCard key={a.id} absence={a} {...cardProps} />)}
              {registry.length > limit && <button type="button" className="mab-more" onClick={() => setLimit(l => l + PAGE)}>عرض المزيد ({registry.length - limit})</button>}
            </div>
          )
      )}

      {can('absences', 'add') && (
        <button type="button" className="mab-fab" onClick={() => c.openAddAbsenceDialog(undefined, false)} aria-label="تسجيل حالة" title="تسجيل حالة">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {c.isHistoryDialogOpen && member && (
        <MobileAbsenceMember
          member={member}
          records={recordsOf(c.absences, member.id)}
          onAdd={() => c.openAddAbsenceDialog(member.id)}
          onClose={c.closeHistoryDialog}
          {...cardProps}
        />
      )}

      {c.isAddAbsenceDialogOpen && (
        <MobileAbsenceForm
          key={`${c.selectedMemberForAbsenceId ?? 'x'}-${c.isMultiMode}`}
          members={c.members}
          meetings={c.meetings}
          defaultPlayerId={c.selectedMemberForAbsenceId}
          multi={c.isMultiMode}
          onSubmit={c.handleAddAbsence}
          onClose={c.closeAddAbsenceDialog}
        />
      )}

      {c.isJustificationDialogOpen && (
        <MobileJustifySheet absence={c.selectedAbsence} onSubmit={c.submitJustification} onClose={c.closeJustificationDialog} />
      )}
    </div>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
