import { forwardRef } from 'react';
import './PrintableIncidentReport.css';
import receiptBg from '../../../../assets/receipt-template.png';

interface PrintableHearingSummonsProps {
  incident: any;
}

export const PrintableHearingSummons = forwardRef<HTMLDivElement, PrintableHearingSummonsProps>(({ incident }, ref) => {
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
            استدعاء لجلسة استماع — DIS-04
          </div>

          <div className="section-title">الموضوع: استدعاء لجلسة استماع</div>
          
          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '18px', lineHeight: '2' }}>
            يدعى اللاعب السيد: <strong style={{ textDecoration: 'underline' }}>{incident.memberName}</strong> للحضور أمام: {incident.hearingLocation || '................................................................'}
            <br />
            بتاريخ: {incident.deadlineOrHearingDate ? new Date(incident.deadlineOrHearingDate).toLocaleDateString('en-GB') : '.......................................'}
            <br />
            الساعة: {incident.deadlineOrHearingDate ? new Date(incident.deadlineOrHearingDate).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : '.......................................'}
            <br />
            المكان: {incident.incidentLocation || '................................................................'}
          </div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px', lineHeight: '1.8' }}>
            وذلك للاستماع إلى أقواله بشأن الواقعة المؤرخة في {new Date(incident.incidentDate).toLocaleDateString('en-GB')} والمتعلقة بـ:
          </div>
          
          <div className="declaration-text" style={{ minHeight: '80px', border: '1px solid #000', padding: '10px', marginTop: '10px' }}>
            {incident.reason || '................................................................................................................................'}
          </div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px' }}>
            يتيح للاعب خلال الجلسة تقديم توضيحاته وما يراه من وثائق أو عناصر مرتبطة بالواقعة.
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
