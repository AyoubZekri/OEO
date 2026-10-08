import React from 'react';
import '../Disciplinary/Printable/PrintableIncidentReport.css';
import './PrintableClearance.css';
import receiptBg from '../../../assets/receipt-template.png';
import { dayText, isSigned, type ClearanceState, type DepartmentId } from './clearance';

const DOTS = '...............';
const LONG_DOTS = '................................................................................................';

/** The reasons as the document lists them; the card's reason is ticked */
const REASONS: { label: string; matches: string[] }[] = [
  { label: 'انتهاء العقد', matches: ['انتهاء العقد', 'انتهاء العقد بالتراضي'] },
  { label: 'انتقال', matches: ['انتقال'] },
  { label: 'إعارة', matches: ['إعارة'] },
  { label: 'فسخ بالتراضي', matches: ['فسخ عقد', 'فسخ بالتراضي'] },
];

const Box: React.FC<{ on: boolean; children: React.ReactNode }> = ({ on, children }) => (
  <li className={on ? 'on' : ''}><span className="pc-box">{on ? '✓' : ''}</span>{children}</li>
);

/** "بطاقة إخلاء طرف لاعب": the clearance card on the club's letterhead, its boxes ticked from the departments' signatures */
export const PrintableClearance: React.FC<{ playerName: string; state: ClearanceState }> = ({ playerName, state }) => {
  const { card, checks, signers } = state;
  const now = new Date();
  const season = now.getMonth() >= 6 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;
  const signed = (id: DepartmentId) => isSigned(card, id);
  const noteOf = (column: string) => (typeof card?.[column] === 'string' ? (card[column] as string).trim() : '');

  const reason = card?.exit_reason || '';
  const known = REASONS.some(r => r.matches.includes(reason));

  // Equipment: returned in full, or what is still out / the signer's note
  const equipmentIssues = [...checks.equipment.map(p => p.text), noteOf('equipment_notes')].filter(Boolean).join('، ');
  const notes = [
    card?.general_notes?.trim(),
    noteOf('admin_notes') && `الإدارة: ${noteOf('admin_notes')}`,
    noteOf('sporting_notes') && `الجانب الرياضي: ${noteOf('sporting_notes')}`,
    noteOf('financial_notes') && `الجانب المالي: ${noteOf('financial_notes')}`,
  ].filter(Boolean).join('\n');

  const signer = (id: DepartmentId) => (signed(id) ? signers[id] || '' : '');

  return (
    <div className="receipt-wrapper" dir="rtl" style={{ pageBreakAfter: 'auto' }}>
      <img src={receiptBg} alt="" className="receipt-bg-image" />
      <div className="season-overlay" style={{ position: 'absolute', top: '18mm', right: '5mm', color: 'white', fontWeight: 'bold', fontSize: '16px', zIndex: 10, whiteSpace: 'nowrap' }}>
        الموسم الرياضي {season}
      </div>

      <div className="receipt-content pc">
        <h1 className="pc-title">بطاقة إخلاء طرف لاعب</h1>

        <div className="pc-info">
          <p>اللاعب: <strong>{playerName || DOTS}</strong></p>
          <p>تاريخ انتهاء/إنهاء العلاقة: <strong dir="ltr">{dayText(card?.exit_date) || DOTS}</strong></p>
          <p className="pc-reasons">
            سبب المغادرة:{' '}
            {REASONS.map(r => (
              <span key={r.label} className={r.matches.includes(reason) ? 'on' : ''}>{r.label}</span>
            ))}
            <span className={reason && !known ? 'on' : ''}>أخرى وفقا للإجراءات القانونية{reason && !known ? ` (${reason})` : ''}</span>
          </p>
        </div>

        <div className="pc-label">وضعية اللاعب</div>
        <div className="pc-grid">
          <section>
            <h3>العتاد</h3>
            <ul>
              <Box on={signed('equipment') && !equipmentIssues}>أعيد بالكامل</Box>
              <Box on={Boolean(equipmentIssues)}>توجد ملاحظات: {equipmentIssues || DOTS}</Box>
            </ul>
          </section>
          <section>
            <h3>الإدارة</h3>
            <ul>
              <Box on={signed('admin')}>سلم الوثائق المطلوبة</Box>
              <Box on={signed('admin') && checks.admin.length === 0}>لا توجد وثائق معلقة</Box>
            </ul>
          </section>
          <section>
            <h3>الجانب الرياضي</h3>
            <ul>
              <Box on={signed('sporting')}>تمت تسوية الملف</Box>
            </ul>
          </section>
          <section>
            <h3>الجانب المالي</h3>
            <ul>
              <Box on={signed('financial')}>تمت مراجعة المستحقات</Box>
              <Box on={checks.financial.length > 0}>توجد مستحقات معلقة موضحة في كشف منفصل</Box>
            </ul>
          </section>
          <section className="wide">
            <h3>الجانب الطبي</h3>
            <ul>
              <Box on={signed('medical')}>تم غلق الملف الإداري الطبي وفق إجراءات السرية</Box>
            </ul>
          </section>
        </div>

        <div className="pc-label">ملاحظات</div>
        <p className="pc-notes">{notes || `${LONG_DOTS}\n${LONG_DOTS}`}</p>

        <table className="signature-table pc-signs">
          <thead>
            <tr>
              <th>مسؤول العتاد</th>
              <th>الإدارة</th>
              <th>المالية</th>
              <th>المدير الرياضي</th>
              <th>اللاعب</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><small>{signer('equipment')}</small></td>
              <td><small>{signer('admin')}</small></td>
              <td><small>{signer('financial')}</small></td>
              <td><small>{signer('sporting')}</small></td>
              <td><small>{playerName}</small></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
