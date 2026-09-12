import { forwardRef } from 'react';
import './PrintableIncidentReport.css';
import receiptBg from '../../../../assets/receipt-template.png';

interface PrintableClarificationRequestProps {
  incident: any;
}

export const PrintableClarificationRequest = forwardRef<HTMLDivElement, PrintableClarificationRequestProps>(({ incident }, ref) => {
  if (!incident) return null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const displaySeason = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;

  return (
    <div ref={ref}>
      <div className="receipt-wrapper" dir="rtl" style={{ pageBreakAfter: 'auto' }}>
        <img src={receiptBg} alt="Receipt Background" className="receipt-bg-image" />
        
        <div 
          className="season-overlay"
          style={{
            position: 'absolute',
            top: '18mm',
            right: '5mm',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}
        >
          الموسم الرياضي {displaySeason}
        </div>
        
        <div className="receipt-content">
          <div className="receipt-main-title">
            طلب توضيح — DIS-02
          </div>

          <div className="section-title">الموضوع: طلب توضيح كتابي بشأن واقعة</div>
          
          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '18px', lineHeight: '2' }}>
            يطلب من اللاعب السيد: <strong style={{ textDecoration: 'underline' }}>{incident.memberName}</strong> تقديم توضيحات مكتوبة بشأن الواقعة المؤرخة في {new Date(incident.incidentDate).toLocaleDateString('en-GB')}.
          </div>

          <div className="section-title">وصف الواقعة أو المخالفة:</div>
          <div className="declaration-text" style={{ minHeight: '80px', border: '1px solid #000', padding: '10px', marginTop: '10px' }}>
            {incident.reason || '................................................................................................................................'}
          </div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px', lineHeight: '1.8' }}>
            الرجاء تقديم توضيحاتكم وأقوالكم بخصوص هذه الواقعة، وذلك في أجل أقصاه: 
            <strong style={{ textDecoration: 'underline', padding: '0 10px' }}>
              {incident.deadlineOrHearingDate ? new Date(incident.deadlineOrHearingDate).toLocaleDateString('en-GB') : '.......................................'}
            </strong>
          </div>
          
          <div className="declaration-text" style={{ marginTop: '15px', fontSize: '16px' }}>
            ملاحظة: في حالة عدم الرد ضمن الأجل المحدد، يحق للإدارة اتخاذ الإجراءات التأديبية المناسبة بناءً على المعطيات المتوفرة.
          </div>

          <table className="signature-table" style={{ marginTop: '40px' }}>
            <thead>
              <tr>
                <th style={{ width: '50%' }}>الإدارة</th>
                <th style={{ width: '50%' }}>استلم اللاعب بتاريخ: .......................</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><br />...................................................</td>
                <td><br />الإمضاء: .......................................</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
