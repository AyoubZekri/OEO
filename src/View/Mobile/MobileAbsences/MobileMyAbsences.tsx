import React, { useState } from 'react';
import { Plus, UserX, Clock, LogOut, Plane, Hourglass, ShieldCheck, FileWarning, CalendarX2 } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { useUrlDetails } from '../widgets/useUrlDetails';
import { ABSENCE_TYPES, kindOf, byDateDesc } from '../../Screen/Absence/absenceUtils';
import type { useMyAbsences } from '../../Screen/Personal/useMyAbsences';
import { MobileAbsenceCard } from './MobileAbsenceCard';
import { MobileJustifySheet } from './MobileJustifySheet';
import { MobileMyAbsenceRequest } from './MobileMyAbsenceRequest';
import './MobileAbsences.css';

const noop = () => undefined;

// Personal space (phone): my records with my counters, my justifications and my requests
export const MobileMyAbsences: React.FC<{ c: ReturnType<typeof useMyAbsences> }> = ({ c }) => {
  const [type, setType] = useState('');
  // ?absence=ID (from an alert): that record is marked
  const [focusId] = useUrlDetails('absence');
  const s = c.stats;
  const list = c.records.filter(a => !type || kindOf(a) === type).slice().sort(byDateDesc);

  return (
    <div className="mab-page">
      <MobileAppBar title="غياباتي" />

      <section className="mab-hero">
        <div className="mab-hero-top">
          <span className="mab-hero-icon"><FileWarning size={26} /></span>
          <div>
            <small>غياباتي وتبريراتي</small>
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

      {c.records.length > 0 && (
        <div className="mab-types">
          <button type="button" className={!type ? 'on' : ''} onClick={() => setType('')}>الكل</button>
          {ABSENCE_TYPES.map(t => (
            <button key={t.value} type="button" className={`tone-${t.tone} ${type === t.value ? 'on' : ''}`} onClick={() => setType(t.value)}>{t.label}</button>
          ))}
        </div>
      )}

      {c.isLoading ? (
        <MobileLoader text="جاري تحميل سجلك..." />
      ) : list.length === 0 ? (
        <div className="mab-empty big">
          {c.records.length ? <CalendarX2 size={34} /> : <ShieldCheck size={34} />}
          <strong>{c.records.length ? 'لا توجد سجلات من هذا النوع' : 'لا توجد غيابات مسجلة عليك'}</strong>
        </div>
      ) : (
        <div className="mab-list">
          {list.map(a => (
            <MobileAbsenceCard
              key={a.id}
              absence={a}
              hideMember
              personal
              focused={focusId === String(a.id)}
              onJustify={c.openJustify}
              onDecide={noop}
              onDelete={noop}
            />
          ))}
        </div>
      )}

      <button type="button" className="mab-fab" onClick={c.openRequest} aria-label="طلب عطلة أو غياب" title="طلب عطلة أو غياب">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {c.justifyId !== null && <MobileJustifySheet absence={c.justifying} onSubmit={c.justify} onClose={c.closeJustify} />}
      {c.requestOpen && <MobileMyAbsenceRequest onSubmit={c.request} onClose={c.closeRequest} />}
    </div>
  );
};
