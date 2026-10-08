import { forwardRef } from 'react';
import './PrintableIncidentReport.css';
import receiptBg from '../../../../assets/receipt-template.png';

interface PrintableHearingReportProps {
  incident: any;
}

const DOTS = '...............';
const LONG_DOTS = '................................................................';

/** "YYYY-MM-DD" → "DD/MM/YYYY" */
const dayText = (value?: string) => {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

/** The people present, from the case's "present people" (one per line, or separated by commas) */
const attendeesOf = (text?: string) =>
  (text || '').split(/[\n,،]+/).map(s => s.trim()).filter(Boolean);

/** Minutes of a hearing (محضر جلسة استماع): printed once the hearing has closed */
export const PrintableHearingReport = forwardRef<HTMLDivElement, PrintableHearingReportProps>(({ incident }, ref) => {
  if (!incident) return null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const displaySeason = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;

  const date = dayText(incident.deadlineOrHearingDate) || DOTS;
  const time = incident.hearingTime || DOTS;
  const attendees = attendeesOf(incident.presentPeople);
  const lines = attendees.length ? attendees : [LONG_DOTS, LONG_DOTS, LONG_DOTS];
  const box = { minHeight: '50px', border: '1px solid #000', padding: '10px', marginTop: '10px', whiteSpace: 'pre-wrap' as const };

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
          <div className="receipt-main-title">محضر جلسة استماع</div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px' }}>
            بتاريخ <strong>{date}</strong> على الساعة <strong dir="ltr">{time}</strong>، تم الاستماع إلى اللاعب:{' '}
            <strong style={{ textDecoration: 'underline' }}>{incident.memberName || LONG_DOTS}</strong>
          </div>

          <div className="declaration-text" style={{ marginTop: '16px', fontSize: '16px' }}>
            بحضور:
            <ul style={{ listStyleType: 'disc', marginRight: '30px', marginTop: '8px' }}>
              {lines.map((name, i) => <li key={i}>{name}</li>)}
            </ul>
          </div>

          <div className="section-title">موضوع الجلسة:</div>
          <div className="declaration-text" style={box}>{incident.reason || LONG_DOTS}</div>

          <div className="section-title">أقوال اللاعب:</div>
          <div className="declaration-text" style={{ ...box, minHeight: '100px' }}>
            {incident.player_statements || `${LONG_DOTS}\n${LONG_DOTS}`}
          </div>

          <div className="section-title">ملاحظات الإدارة:</div>
          <div className="declaration-text" style={{ ...box, minHeight: '60px' }}>{incident.admin_notes || LONG_DOTS}</div>

          <div className="declaration-text" style={{ marginTop: '20px', fontSize: '16px' }}>
            اختتمت الجلسة على الساعة: <strong dir="ltr">{incident.hearingEndTime || DOTS}</strong>
          </div>

          <table className="signature-table" style={{ marginTop: '30px' }}>
            <thead>
              <tr>
                <th style={{ width: '50%' }}>اللاعب: {incident.memberName || DOTS}</th>
                <th style={{ width: '50%' }}>مسؤول الجلسة: {incident.hearingOfficer || DOTS}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
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
