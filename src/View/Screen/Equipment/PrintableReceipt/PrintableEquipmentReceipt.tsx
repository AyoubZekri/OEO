import { forwardRef } from 'react';
import './PrintableEquipmentReceipt.css';
import receiptBg from '../../../../assets/receipt-template.png';

interface EquipmentItem {
  name: string;
  quantity: number;
  conditionHandover: string;
  returnDate?: string;
  conditionReturn?: string;
}

interface PrintableEquipmentReceiptProps {
  clubName: string;
  recordNumber: string;
  season: string;
  playerName: string;
  shirtNumber: string;
  category: string;
  handoverDate: string;
  items: EquipmentItem[];
  printType?: 'handover' | 'return';
}

export const PrintableEquipmentReceipt = forwardRef<HTMLDivElement, PrintableEquipmentReceiptProps>(
  ({ recordNumber, season, playerName, shirtNumber, category, handoverDate, items, printType = 'handover' }, ref) => {
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const displaySeason = season || (currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`);

    return (
      <div className="receipt-wrapper" ref={ref} dir="rtl">
        <img src={receiptBg} alt="Receipt Background" className="receipt-bg-image" />
        
        <div 
          className="season-overlay"
          style={{
            position: 'absolute',
            top: '18mm',
            right: '5mm', /* Adjust to fit exactly where the old text was */
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
            محضر تسليم واسترجاع معدات للاعب
          </div>

          <div className="top-details">
            <div>أرزيو في : {new Date().toLocaleDateString('en-GB')}</div>
            <div>رقم المحضر: {recordNumber ? String(recordNumber).padStart(4, '0') : ''}</div>
          </div>

          <div className="section-title">بيانات اللاعب</div>
          <table className="receipt-table">
            <tbody>
              <tr>
                <td className="col-50">الاسم واللقب: <span style={{fontWeight: 'normal'}}>{playerName}</span></td>
                <td className="col-50">الفئة: <span style={{fontWeight: 'normal'}}>{category}</span></td>
              </tr>
              <tr>
                <td>رقم القميص: <span style={{fontWeight: 'normal'}}>{shirtNumber}</span></td>
                <td>تاريخ التسليم: <span style={{fontWeight: 'normal'}}>{handoverDate}</span></td>
              </tr>
            </tbody>
          </table>

          <div className="section-title">المعدات {printType === 'handover' ? 'المسلمة' : 'المسترجعة'}</div>
          <table className="receipt-table" style={{textAlign: 'center'}}>
            <thead>
              <tr>
                <th style={{textAlign: 'right'}}>المعدات</th>
                <th>الكمية</th>
                {printType === 'handover' ? (
                  <>
                    <th>تاريخ التسليم</th>
                    <th>الحالة عند التسليم</th>
                  </>
                ) : (
                  <>
                    <th>تاريخ الإرجاع</th>
                    <th>الحالة عند الإرجاع</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index}>
                    <td style={{textAlign: 'right', fontWeight: 'normal'}}>{item.name}</td>
                    <td style={{fontWeight: 'normal'}}>{item.quantity}</td>
                    {printType === 'handover' ? (
                      <>
                        <td style={{fontWeight: 'normal'}}>{handoverDate}</td>
                        <td style={{fontWeight: 'normal'}}>{item.conditionHandover}</td>
                      </>
                    ) : (
                      <>
                        <td style={{fontWeight: 'normal'}}>{item.returnDate}</td>
                        <td style={{fontWeight: 'normal'}}>{item.conditionReturn}</td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{textAlign: 'center', fontWeight: 'normal', padding: '20px'}}>لا توجد معدات</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="section-title">إقرار اللاعب</div>
          <div className="declaration-text">
            أقر باستلام المعدات المذكورة أعلاه، وأتعهد باستعمالها فيما خصصت له والمحافظة عليها 
            وإعادتها عند طلب النادي أو عند انتهاء علاقتي به، وفق النظام الداخلي.
          </div>

          <div className="section-title">التوقيعــــــات</div>
          <table className="signature-table">
            <thead>
              <tr>
                <th>إمضاء مسؤول العتاد</th>
                <th>إمضاء اللاعب</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

PrintableEquipmentReceipt.displayName = 'PrintableEquipmentReceipt';
