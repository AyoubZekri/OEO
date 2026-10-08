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

const DOTS = '..................';

/**
 * The equipment receipt of one operation (A4, the club's letterhead):
 * handover — what the player received; return — what the player gave back.
 */
export const PrintableEquipmentReceipt = forwardRef<HTMLDivElement, PrintableEquipmentReceiptProps>(
  ({ recordNumber, season, playerName, shirtNumber, category, handoverDate, items, printType = 'handover' }, ref) => {
    const now = new Date();
    const displaySeason = season || (now.getMonth() >= 6 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`);
    const handover = printType === 'handover';
    const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    // The return date of the receipt: the latest of its items
    const returnDate = items.map(i => i.returnDate).filter(Boolean).pop() || '';

    return (
      <div className="receipt-wrapper" ref={ref} dir="rtl">
        <img src={receiptBg} alt="" className="receipt-bg-image" />
        <div className="season-overlay" style={{ position: 'absolute', top: '18mm', right: '5mm', color: 'white', fontWeight: 'bold', fontSize: '16px', zIndex: 10, whiteSpace: 'nowrap' }}>
          الموسم الرياضي {displaySeason}
        </div>

        <div className="receipt-content er">
          <div className="er-meta">
            <span>رقم المحضر: <strong dir="ltr">{recordNumber ? String(recordNumber).padStart(4, '0') : DOTS}</strong></span>
            <span>أرزيو في: <strong dir="ltr">{now.toLocaleDateString('en-GB')}</strong></span>
          </div>

          <h1 className="er-title">{handover ? 'محضر تسليم معدات' : 'محضر استرجاع معدات'}</h1>

          <table className="receipt-table er-player">
            <tbody>
              <tr>
                <th>الاسم واللقب</th>
                <td>{playerName || DOTS}</td>
                <th>الفئة</th>
                <td>{category || DOTS}</td>
              </tr>
              <tr>
                <th>رقم القميص</th>
                <td>{shirtNumber || DOTS}</td>
                <th>{handover ? 'تاريخ التسليم' : 'تاريخ الإرجاع'}</th>
                <td dir="ltr">{(handover ? handoverDate : returnDate) || DOTS}</td>
              </tr>
            </tbody>
          </table>

          <div className="er-label">{handover ? 'المعدات المسلَّمة' : 'المعدات المسترجَعة'}</div>
          <table className="receipt-table er-items">
            <thead>
              <tr>
                <th className="er-no">#</th>
                <th className="er-name">المعدات</th>
                <th>الكمية</th>
                {handover ? (
                  <th>الحالة عند التسليم</th>
                ) : (
                  <>
                    <th>الحالة عند التسليم</th>
                    <th>تاريخ الإرجاع</th>
                    <th>الحالة عند الإرجاع</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item, index) => (
                <tr key={index}>
                  <td className="er-no">{index + 1}</td>
                  <td className="er-name">{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.conditionHandover || '—'}</td>
                  {!handover && (
                    <>
                      <td dir="ltr">{item.returnDate || '—'}</td>
                      <td>{item.conditionReturn || '—'}</td>
                    </>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={handover ? 4 : 6} className="er-empty">لا توجد معدات</td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2}>المجموع</td>
                  <td>{total}</td>
                  <td colSpan={handover ? 1 : 3} />
                </tr>
              </tfoot>
            )}
          </table>

          <p className="er-declaration">
            {handover
              ? 'أقر أنا الموقع أدناه باستلام المعدات المذكورة أعلاه بالحالة المبينة، وأتعهد باستعمالها فيما خُصصت له والمحافظة عليها وإعادتها عند طلب النادي أو عند انتهاء علاقتي به، وفقاً للنظام الداخلي.'
              : 'يشهد مسؤول العتاد باسترجاع المعدات المذكورة أعلاه من اللاعب بالحالة المبينة، وتُبرأ ذمة اللاعب من المعدات المسترجعة دون غيرها.'}
          </p>

          <table className="signature-table er-signs">
            <thead>
              <tr>
                <th>{handover ? 'مسؤول العتاد (المسلِّم)' : 'مسؤول العتاد (المستلِم)'}</th>
                <th>{handover ? 'اللاعب (المستلِم)' : 'اللاعب (المسلِّم)'}</th>
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
    );
  }
);

PrintableEquipmentReceipt.displayName = 'PrintableEquipmentReceipt';
