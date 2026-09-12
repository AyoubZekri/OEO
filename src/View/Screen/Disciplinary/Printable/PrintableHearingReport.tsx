import { forwardRef } from 'react';
import './PrintableIncidentReport.css';
import receiptBg from '../../../../assets/receipt-template.png';

interface PrintableHearingReportProps {
  incident: any;
}

export const PrintableHearingReport = forwardRef<HTMLDivElement, PrintableHearingReportProps>(({ incident }, ref) => {
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
            11. محضر جلسة استماع — DIS-05
          </div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px' }}>
            بتاريخ {new Date().toLocaleDateString('en-GB')} على الساعة {new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}، تم الاستماع إلى اللاعب: <strong style={{ textDecoration: 'underline' }}>{incident.memberName}</strong>
          </div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px' }}>
            بحضور:
            <ul style={{ listStyleType: 'disc', marginRight: '30px', marginTop: '10px' }}>
              <li>................................................................</li>
              <li>................................................................</li>
              <li>................................................................</li>
            </ul>
          </div>

          <div className="section-title">موضوع الجلسة:</div>
          <div className="declaration-text" style={{ minHeight: '50px', border: '1px solid #000', padding: '10px', marginTop: '10px' }}>
            {incident.reason || '................................................................................................................................'}
          </div>

          <div className="section-title">أقوال اللاعب:</div>
          <div className="declaration-text" style={{ minHeight: '100px', border: '1px solid #000', padding: '10px', marginTop: '10px' }}>
            {incident.player_statements || '................................................................................................................................\n................................................................................................................................'}
          </div>

          <div className="section-title">ملاحظات الإدارة:</div>
          <div className="declaration-text" style={{ minHeight: '60px', border: '1px solid #000', padding: '10px', marginTop: '10px' }}>
            {incident.admin_notes || '................................................................................................................................'}
          </div>

          <div className="section-title">الوثائق المقدمة:</div>
          <div className="declaration-text" style={{ minHeight: '40px', border: '1px solid #000', padding: '10px', marginTop: '10px' }}>
            {incident.attachments || '................................................................................................................................'}
          </div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px' }}>
            اختتمت الجلسة على الساعة: .......................................
          </div>

          <table className="signature-table" style={{ marginTop: '30px' }}>
            <thead>
              <tr>
                <th style={{ width: '33%' }}>اللاعب</th>
                <th style={{ width: '33%' }}>مسؤول الجلسة</th>
                <th style={{ width: '33%' }}>الأعضاء</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><br />........................</td>
                <td><br />........................</td>
                <td><br />........................</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
