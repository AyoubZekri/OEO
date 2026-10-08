import { forwardRef } from 'react';
import './PrintableIncidentReport.css';
import './PrintableDisciplinaryDecision.css';
import receiptBg from '../../../../assets/receipt-template.png';
import type { DisciplinaryModel } from '../disciplinary_data';
import { decisionKindOf } from '../decision';

/** "YYYY-MM-DD…" → "DD/MM/YYYY" */
const dayText = (value?: string) => {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

const DOTS = '...............';
const LONG_DOTS = '................................................................................................';

/** The administration's decision, a simple administrative document on the club's letterhead; its title is the decision itself */
export const PrintableDisciplinaryDecision = forwardRef<HTMLDivElement, { incident: DisciplinaryModel }>(({ incident }, ref) => {
  const now = new Date();
  const season = now.getMonth() >= 6 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;
  const number = `DIS-${String(incident.id).padStart(3, '0')}/${now.getFullYear()}`;
  const kind = decisionKindOf(incident.decision_outcome);

  return (
    <div ref={ref}>
      <div className="receipt-wrapper" dir="rtl" style={{ pageBreakAfter: 'auto' }}>
        <img src={receiptBg} alt="" className="receipt-bg-image" />
        <div className="season-overlay" style={{ position: 'absolute', top: '18mm', right: '5mm', color: 'white', fontWeight: 'bold', fontSize: '16px', zIndex: 10, whiteSpace: 'nowrap' }}>
          الموسم الرياضي {season}
        </div>

        <div className="receipt-content dd">
          <div className="dd-meta">
            <span>قرار رقم: <strong dir="ltr">{number}</strong></span>
            <span>التاريخ: <strong dir="ltr">{now.toLocaleDateString('en-GB')}</strong></span>
          </div>

          {/* The decision itself is the title */}
          <h1 className="dd-title">{kind === 'none' ? 'حفظ الملف دون إجراء' : incident.decision_outcome}</h1>

          <p className="dd-text">
            بعد الاطلاع على النظام الداخلي، ومحضر الواقعة، وتوضيحات اللاعب ومحضر الاستماع عند الاقتضاء، تقرر:
          </p>

          <p className="dd-text">بشأن اللاعب: <strong className="dd-name">{incident.memberName || LONG_DOTS.slice(0, 30)}</strong></p>

          <div className="dd-label">الأسباب:</div>
          <p className="dd-reasons">{incident.decision_reasons?.trim() || `${LONG_DOTS}\n${LONG_DOTS}`}</p>

          <p className="dd-text">تاريخ سريان القرار: <strong dir="ltr">{dayText(incident.effective_date) || DOTS}</strong></p>

          <p className="dd-text dd-notice">
            ويبلغ اللاعب بالقرار وبإمكانية استعمال طرق الاعتراض أو التظلم المتاحة وفقا للنظام الداخلي والقواعد المعمول بها.
          </p>

          <table className="signature-table dd-sign">
            <thead>
              <tr>
                <th>الجهة المختصة</th>
                <th>الإمضاء</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
