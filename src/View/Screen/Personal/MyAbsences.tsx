import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, UserX, Clock, LogOut, Plane, Hourglass, ShieldCheck, FileWarning } from 'lucide-react';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { AbsenceCard } from '../Absence/AbsenceCard';
import { JustificationDialog } from '../Absence/JustificationDialog';
import { ABSENCE_TYPES, kindOf, byDateDesc } from '../Absence/absenceUtils';
import { MobileMyAbsences } from '../../Mobile/MobileAbsences/MobileMyAbsences';
import { useMyAbsences } from './useMyAbsences';
import { MyAbsenceRequestDialog } from './MyAbsenceRequestDialog';
import '../Absence/Absence.css';

const noop = () => undefined;

/**
 * Personal space: my absences, lateness, leaves and holiday requests, with the same cards as the management page.
 * I justify a record without a justification (or refused), and I ask for a holiday or announce an absence.
 */
export const MyAbsences: React.FC = () => {
  const c = useMyAbsences();
  const isMobile = useIsMobile();
  const [type, setType] = useState('');
  // ?absence=ID (from an alert): the record's card is brought into view and marked
  const [params] = useSearchParams();
  const focusId = isMobile ? null : params.get('absence');
  useEffect(() => {
    if (!focusId || c.isLoading) return;
    document.getElementById(`absence-card-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, c.isLoading, c.records]);

  if (isMobile) return <MobileMyAbsences c={c} />;

  const s = c.stats;
  const list = c.records.filter(a => !type || kindOf(a) === type).slice().sort(byDateDesc);
  const tiles = [
    { key: 'absent', label: 'غياب', value: s.absent, icon: UserX, tone: 'red' },
    { key: 'late', label: 'تأخر', value: s.late, icon: Clock, tone: 'amber' },
    { key: 'leave', label: 'مغادرة', value: s.leave, icon: LogOut, tone: 'orange' },
    { key: 'request', label: 'طلبات عطلة', value: s.request, icon: Plane, tone: 'violet' },
    { key: 'pending', label: 'قيد الدراسة', value: s.pending, icon: Hourglass, tone: 'blue' },
    { key: 'justified', label: 'مبررة', value: s.justified, icon: ShieldCheck, tone: 'green' },
  ];

  return (
    <div className="ab-page">
      <section className="ab-hero">
        <div className="ab-hero-main">
          <span className="ab-hero-icon"><FileWarning size={30} /></span>
          <div>
            <small>غياباتي وتبريراتي</small>
            <strong>{s.total} <span>سجل</span></strong>
          </div>
          <div className="ab-hero-actions">
            <button type="button" className="ab-add" onClick={c.openRequest}>
              <Plus size={18} /> طلب عطلة أو غياب
            </button>
          </div>
        </div>
        <div className="ab-tiles">
          {tiles.map(t => (
            <div key={t.key} className={`ab-tile tone-${t.tone}`}>
              <span><t.icon size={18} /></span>
              <strong>{t.value}</strong>
              <small>{t.label}</small>
            </div>
          ))}
        </div>
      </section>

      {c.records.length > 0 && (
        <div className="ab-toolbar">
          <div className="ab-chips">
            <button type="button" className={!type ? 'on' : ''} onClick={() => setType('')}>الكل</button>
            {ABSENCE_TYPES.map(t => (
              <button key={t.value} type="button" className={`tone-${t.tone} ${type === t.value ? 'on' : ''}`} onClick={() => setType(t.value)}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="ab-empty">
          <span>{c.records.length ? <FileWarning size={34} /> : <ShieldCheck size={34} />}</span>
          <strong>{c.isLoading ? 'جاري تحميل سجلك...' : c.records.length ? 'لا توجد سجلات من هذا النوع' : 'لا توجد غيابات مسجلة عليك'}</strong>
        </div>
      ) : (
        <div className="ab-grid">
          {list.map(a => (
            <AbsenceCard
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

      <JustificationDialog isOpen={c.justifyId !== null} absence={c.justifying} onClose={c.closeJustify} onSubmit={c.justify} />
      {c.requestOpen && <MyAbsenceRequestDialog onSubmit={c.request} onClose={c.closeRequest} />}
    </div>
  );
};
