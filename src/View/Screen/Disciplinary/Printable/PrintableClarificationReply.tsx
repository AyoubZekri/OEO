import { forwardRef } from 'react';
import './PrintableIncidentReport.css';
import receiptBg from '../../../../assets/receipt-template.png';

interface PrintableClarificationReplyProps {
  incident: any;
}

export const PrintableClarificationReply = forwardRef<HTMLDivElement, PrintableClarificationReplyProps>(({ incident }, ref) => {
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
            رد اللاعب على طلب توضيح — DIS-03
          </div>

          <div className="section-title">بيانات اللاعب:</div>
          <div className="declaration-text" style={{ marginTop: '10px', fontSize: '16px' }}>
            الاسم واللقب: <strong style={{ textDecoration: 'underline' }}>{incident.memberName}</strong>
          </div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px', lineHeight: '1.8' }}>
            بناءً على طلب التوضيح الموجه إلي بخصوص الواقعة المؤرخة في {new Date(incident.incidentDate).toLocaleDateString('en-GB')}، أتقدم بالتوضيحات والأقوال التالية:
          </div>

          <div className="section-title">أقوال اللاعب وتبريراته:</div>
          <div className="declaration-text" style={{ minHeight: '150px', border: '1px solid #000', padding: '10px', marginTop: '10px' }}>
            {incident.player_statements || '................................................................................................................................\n................................................................................................................................'}
          </div>

          <table className="signature-table" style={{ marginTop: '30px' }}>
            <thead>
              <tr>
                <th style={{ width: '100%', textAlign: 'left', paddingLeft: '50px' }}>إمضاء اللاعب</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '50px' }}><br />........................</td>
              </tr>
            </tbody>
          </table>

          <div className="section-title" style={{ marginTop: '30px' }}>ملاحظات الإدارة (خاص بالإدارة):</div>
          <div className="declaration-text" style={{ minHeight: '60px', border: '1px solid #000', padding: '10px', marginTop: '10px' }}>
            {incident.admin_notes || '................................................................................................................................'}
          </div>

        </div>
      </div>
    </div>
  );
});
