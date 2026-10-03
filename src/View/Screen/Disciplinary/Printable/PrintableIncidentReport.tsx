import { forwardRef } from 'react';
import './PrintableIncidentReport.css';
import receiptBg from '../../../../assets/receipt-template.png';

interface PrintableIncidentReportProps {
  incident: any;
  printType?: 'incident' | 'decision' | 'both';
}

export const PrintableIncidentReport = forwardRef<HTMLDivElement, PrintableIncidentReportProps>(({ incident, printType = 'both' }, ref) => {
  if (!incident) return null;

  const dateObj = new Date(incident.incidentDate);
  const dateStr = dateObj.toLocaleDateString('en-GB');
  const timeStr = dateObj.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const displaySeason = currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;

  return (
    <div ref={ref}>
      {/* Page 1: Incident */}
      {(printType === 'incident' || printType === 'both') && (
        <div className="receipt-wrapper" dir="rtl" style={{ pageBreakAfter: printType === 'both' ? 'always' : 'auto' }}>
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
              محضر معاينة واقعة
            </div>

            <div className="top-details">
              <div>الوادي في : {new Date().toLocaleDateString('en-GB')}</div>
              <div>رقم المحضر: {String(incident.id).padStart(4, '0')}</div>
            </div>

            <div className="declaration-text" style={{ marginTop: '30px', fontSize: '1.1rem', lineHeight: '1.8' }}>
              بتاريخ <strong>{dateStr}</strong> على الساعة <strong>{timeStr}</strong>، تمت معاينة الواقعة الآتية المتعلقة بالعضو: <strong>{incident.memberName}</strong>
            </div>

            <div className="declaration-text" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
              مكان الواقعة: <strong>{incident.incidentLocation || '................................................................'}</strong>
            </div>

            <div className="declaration-text" style={{ marginTop: '20px', fontWeight: 'bold' }}>وصف دقيق ومحايد للواقعة:</div>
            <div className="declaration-text" style={{ minHeight: '80px', padding: '10px 0', fontSize: '1.1rem', lineHeight: '1.8' }}>
              {incident.reason || '................................................................\n................................................................'}
            </div>

            <div className="declaration-text" style={{ marginTop: '20px', fontWeight: 'bold' }}>الأشخاص الحاضرون إن وجدوا:</div>
            <div className="declaration-text" style={{ minHeight: '40px', padding: '10px 0', fontSize: '1.1rem', lineHeight: '1.8' }}>
              {incident.presentPeople || '................................................................'}
            </div>

            <div className="declaration-text" style={{ marginTop: '20px', fontWeight: 'bold' }}>الوثائق أو الأدلة المرفقة إن وجدت:</div>
            <div className="declaration-text" style={{ minHeight: '40px', padding: '10px 0', fontSize: '1.1rem', lineHeight: '1.8' }}>
              {incident.attachments || '................................................................'}
            </div>

            <div className="declaration-text" style={{ marginTop: '40px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'justify' }}>
              حرر هذا المحضر لإثبات الواقعة وإحالته إلى الجهة المختصة دون أن يشكل في حد ذاته قرارا تأديبيا.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 20px', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <div style={{ textAlign: 'right' }}>
                محرر المحضر (الصفة): <br /><br />
                <span style={{ fontWeight: 'normal' }}>...................................................</span>
              </div>
              <div style={{ textAlign: 'left', minWidth: '150px' }}>
                الإمضاء: <br /><br />
                <span style={{ fontWeight: 'normal' }}>...................................................</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page 2: Disciplinary Decision */}
      {(printType === 'decision' || printType === 'both') && (
        <div className="receipt-wrapper" dir="rtl">
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
              12. قرار تأديبي — DIS-06
            </div>

            <div className="top-details">
              <div>الوادي في : {new Date().toLocaleDateString('en-GB')}</div>
              <div>قرار رقم: {String(incident.id).padStart(4, '0')}</div>
            </div>

            <div className="declaration-text" style={{ marginTop: '20px' }}>
              بعد الاطلاع على النظام الداخلي، ومحضر الواقعة، وتوضيحات العضو ومحضر الاستماع عند الاقتضاء، تقرر:
            </div>

            <div className="declaration-text">
              بشأن العضو: <span style={{ fontWeight: 'normal', textDecoration: 'underline' }}>{incident.memberName}</span>
            </div>

            <div className="declaration-text" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', fontSize: '16px' }}>
              {[
                'حفظ',
                'تنبيه',
                'تنبيه كتابي',
                'إنذار',
                'عقوبة',
                'فصل'
              ].map((type) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '16px', height: '16px', border: '1px solid #000', marginLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {incident.decision_outcome === type ? '✓' : ''}
                  </div> 
                  {type}
                </div>
              ))}
            </div>

            <div className="section-title">الأسباب</div>
            <div className="declaration-text" style={{ minHeight: '60px', border: '1px solid #000', padding: '10px' }}>
              {incident.decision_reasons || '........................................................................................................................................'}
            </div>

            <div className="declaration-text" style={{ marginTop: '20px' }}>
              تاريخ سريان القرار: {incident.effective_date ? new Date(incident.effective_date).toLocaleDateString('ar-DZ') : '.......................................'}
            </div>

            <div className="declaration-text" style={{ marginTop: '15px' }}>
              ويبلغ العضو بالقرار وبإمكانية استعمال طرق الاعتراض أو التظلم المتاحة وفقا للنظام الداخلي والقواعد المعمول بها.
            </div>

            <table className="signature-table" style={{ marginTop: '40px' }}>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>الجهة المختصة</th>
                  <th style={{ width: '50%' }}>الإمضاء</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><br />...................................................</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
