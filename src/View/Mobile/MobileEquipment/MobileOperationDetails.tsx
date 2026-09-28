import React, { useState } from 'react';
import { Package, RefreshCw, Undo2, Printer, Pencil, Calendar, Hash, Trophy, Check } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSheet } from '../widgets/MobileSheet';
import { isoDay } from '../MobileTrainingSessions/sessionUtils';
import {
  type OperationPermissions, memberNameOf, initials, movementsOf, returnedCount, shortDate, RETURN_CONDITIONS,
} from './equipmentUtils';
import '../MobileEvaluations/MobileEvaluations.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- operations come untyped from the API */

interface MobileOperationDetailsProps {
  operation: any;
  can: OperationPermissions;
  onReturn: (movementId: string, returnDate: string, condition: string) => Promise<boolean>;
  onUndoReturn: (movementId: string) => Promise<boolean>;
  onEdit: () => void;
  onPrint: () => void;
  onClose: () => void;
}

// One handover operation (phone): every item with its return state; return / undo from here
export const MobileOperationDetails: React.FC<MobileOperationDetailsProps> = ({
  operation: op, can, onReturn, onUndoReturn, onEdit, onPrint, onClose,
}) => {
  const [returning, setReturning] = useState<any | null>(null);
  const [date, setDate] = useState(isoDay(0));
  const [condition, setCondition] = useState('جيد');
  const [busy, setBusy] = useState(false);

  const name = memberNameOf(op);
  const moves = movementsOf(op);
  const back = returnedCount(op);

  const startReturn = (mov: any) => {
    setDate(new Date().toISOString().split('T')[0]);
    setCondition('جيد');
    setReturning(mov);
  };

  const confirmReturn = async () => {
    setBusy(true);
    await onReturn(returning.id, date, condition);
    setBusy(false);
    setReturning(null);
  };

  const undo = (mov: any) => {
    if (window.confirm('هل أنت متأكد من التراجع عن هذا الإرجاع؟')) onUndoReturn(mov.id);
  };

  return (
    <MobileScreen
      title="تفاصيل العملية"
      onBack={onClose}
      footer={(can.print || can.edit) ? (
        <>
          {can.print && <button type="button" className="me-btn" onClick={onPrint}><Printer size={18} /> طباعة محضر</button>}
          {can.edit && <button type="button" className="me-btn primary" onClick={onEdit}><Pencil size={18} /> تعديل</button>}
        </>
      ) : undefined}
    >
      <section className="meq-hero">
        <div className="meq-person">
          <span className="meq-avatar big">{initials(name)}</span>
          <div>
            <strong>{name}</strong>
            <small>العضو المستلم</small>
          </div>
        </div>
        <div className="meq-facts">
          <span><Hash size={13} /> مرجع <b dir="ltr">#{op.id}</b></span>
          <span><Calendar size={13} /> <b dir="ltr">{shortDate(op.operation_date)}</b></span>
          {op.sports_season && <span><Trophy size={13} /> <b dir="ltr">{op.sports_season}</b></span>}
        </div>
        {moves.length > 0 && (
          <div className="meq-stock">
            <div className="meq-stock-bar"><div style={{ width: `${(back / moves.length) * 100}%` }} /></div>
            <div className="meq-stock-legend"><span className="in"><i /> أُرجع {back} من {moves.length}</span></div>
          </div>
        )}
      </section>

      <h3 className="meq-title"><Package size={16} /> العتاد المستلم</h3>
      {moves.length === 0 ? (
        <p className="meq-none">لا يوجد عتاد مسجل في هذه العملية</p>
      ) : (
        <div className="meq-moves">
          {moves.map((mov: any) => (
            <article key={mov.id} className={`meq-move ${mov.return_date ? 'back' : 'held'}`}>
              <div className="meq-move-top">
                <span className="meq-move-icon">{mov.return_date ? <Check size={18} strokeWidth={3} /> : <Package size={18} />}</span>
                <strong>{mov.equipment?.name || 'غير معروف'}</strong>
                <b>×{mov.quantity}</b>
              </div>
              <div className="meq-move-grid">
                <div><small>حالة الاستلام</small><strong className="green">{(mov.condition || mov.delivery_condition) || 'غير محدد'}</strong></div>
                {mov.return_date ? (
                  <>
                    <div><small>تاريخ الإرجاع</small><strong dir="ltr">{shortDate(mov.return_date)}</strong></div>
                    <div className="wide"><small>حالة الإرجاع</small><strong className="red">{mov.return_condition || 'مكتمل'}</strong></div>
                  </>
                ) : (
                  <div><small>الإرجاع</small><strong className="amber">لم يُرجع بعد</strong></div>
                )}
              </div>
              {!mov.return_date ? (
                can.giveBack && <button type="button" className="meq-move-btn return" onClick={() => startReturn(mov)}><RefreshCw size={16} /> إرجاع العتاد</button>
              ) : (
                can.edit && <button type="button" className="meq-move-btn undo" onClick={() => undo(mov)}><Undo2 size={16} /> التراجع عن الإرجاع</button>
              )}
            </article>
          ))}
        </div>
      )}

      {returning && (
        <MobileSheet
          title="تأكيد الإرجاع"
          onClose={() => setReturning(null)}
          footer={(
            <div className="meq-sheet-actions">
              <button type="button" className="me-btn" onClick={() => setReturning(null)}>إلغاء</button>
              <button type="button" className="me-btn primary" onClick={confirmReturn} disabled={busy || !date}>
                <RefreshCw size={17} /> {busy ? 'جاري الإرجاع...' : 'تأكيد الإرجاع'}
              </button>
            </div>
          )}
        >
          <div className="meq-return">
            <p><Package size={15} /> {returning.equipment?.name || 'عتاد'} <b>×{returning.quantity}</b></p>
            <label className="me-field">
              <span className="me-label"><Calendar size={14} /> تاريخ الإرجاع</span>
              <input className="me-input" type="date" dir="ltr" value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <div className="me-field">
              <span className="me-label">حالة العتاد عند الإرجاع</span>
              <div className="meq-conds">
                {RETURN_CONDITIONS.map(x => (
                  <button key={x} type="button" className={`c-${RETURN_CONDITIONS.indexOf(x)} ${condition === x ? 'on' : ''}`} onClick={() => setCondition(x)}>{x}</button>
                ))}
              </div>
            </div>
          </div>
        </MobileSheet>
      )}
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
