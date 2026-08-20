import React, { forwardRef } from 'react';
import './PrintableReceipt.css';
import receiptBg from '../../../../assets/receipt-template.png';

interface PrintableReceiptProps {
  payment: any;
  member?: any;
  contract?: any;
  totalPaid?: number; // المدفوع سابقا
  deductions?: number; // الاستقطاعات
  remaining?: number; // الرصيد المتبقي
}

// Convert amount to Arabic words manually to avoid package issues
const numberToArabicWords = (amount: number) => {
  if (!amount || amount <= 0) return '';
  
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  
  const getHundreds = (num: number): string => {
    let result = '';
    const h = Math.floor(num / 100);
    const rem = num % 100;
    
    if (h > 0) result = hundreds[h];
    
    if (rem > 0) {
      if (result) result += ' و ';
      if (rem === 10) result += 'عشرة';
      else if (rem === 11) result += 'أحد عشر';
      else if (rem === 12) result += 'اثنا عشر';
      else if (rem < 20) result += ['ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'][rem - 13];
      else {
        const o = rem % 10;
        const t = Math.floor(rem / 10);
        if (o > 0) {
          result += ones[o];
          if (t > 0) result += ' و ';
        }
        if (t > 0) result += tens[t];
      }
    }
    return result;
  };

  const getThousands = (num: number): string => {
    const th = Math.floor(num / 1000);
    const rem = num % 1000;
    let result = '';
    
    if (th > 0) {
      if (th === 1) result = 'ألف';
      else if (th === 2) result = 'ألفان';
      else if (th >= 3 && th <= 10) result = getHundreds(th) + ' آلاف';
      else result = getHundreds(th) + ' ألف';
    }
    
    if (rem > 0) {
      if (result) result += ' و ';
      result += getHundreds(rem);
    }
    return result;
  };

  const getMillions = (num: number): string => {
    const m = Math.floor(num / 1000000);
    const rem = num % 1000000;
    let result = '';
    
    if (m > 0) {
      if (m === 1) result = 'مليون';
      else if (m === 2) result = 'مليونان';
      else if (m >= 3 && m <= 10) result = getHundreds(m) + ' ملايين';
      else result = getHundreds(m) + ' مليون';
    }
    
    if (rem > 0) {
      if (result) result += ' و ';
      result += getThousands(rem);
    }
    return result;
  };

  try {
    let words = getMillions(Math.floor(amount));
    return words;
  } catch (e) {
    return amount.toString();
  }
};

export const PrintableReceipt = forwardRef<HTMLDivElement, PrintableReceiptProps>((props, ref) => {
  const { payment, member, contract, totalPaid = 0, deductions = 0, remaining = 0 } = props;

  const fullName = member ? `${member.first_name} ${member.last_name}` : payment?.occasion || '';
  const role = member?.type === 'player' ? 'لاعب' : member?.type === 'coach' ? 'مدرب' : member?.type === 'employee' ? 'موظف إداري' : 'أخرى';
  
  const paymentDate = payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-GB') : '';
  const amount = Number(payment?.amount) || 0;
  
  const contractValue = contract ? (Number(contract.contractValue) || 0) : 0;
  
  // Format numbers nicely
  const formatNum = (num: number) => num.toLocaleString('en-US');

  return (
    <div className="receipt-wrapper" ref={ref}>
      <img src={receiptBg} alt="Receipt Background" className="receipt-bg-image" />
      
      <div className="receipt-content">
        <div className="receipt-main-title">
          سند صرف وإقرار باستلام مبلغ مالي
        </div>

        <div className="top-details">
          <div>الوادي في : {paymentDate || '......../....../......'}</div>
          <div>رقم الوصل: {payment?.id || '.......................'}</div>
        </div>

        <div className="section-title">بيانات المستفيد</div>
        <table className="receipt-table">
          <tbody>
            <tr>
              <td className="col-50">الاسم واللقب: <span style={{fontWeight: 'normal'}}>{fullName}</span></td>
              <td className="col-50">الصفة: <span style={{fontWeight: 'normal'}}>{role}</span></td>
            </tr>
            <tr>
              <td>رقم بطاقة الهوية : <span style={{fontWeight: 'normal'}}>{member?.national_id || '..............................'}</span></td>
              <td>رقم العقد أو الاتفاقية: <span style={{fontWeight: 'normal'}}>{contract?.id || '..............................'}</span></td>
            </tr>
            <tr>
              <td>تاريخ ومكان الميلاد: <span style={{fontWeight: 'normal'}}>{member?.birth_date?.split('T')[0]} {member?.place_of_birth}</span></td>
              <td>رقم الهاتف: <span style={{fontWeight: 'normal'}}>{member?.phone || '..............................'}</span></td>
            </tr>
          </tbody>
        </table>

        <div className="section-title">طبيعة المبلغ وطريقة الدفع</div>
        <table className="receipt-table" style={{borderCollapse: 'collapse', padding: 0}}>
          <tbody>
            <tr>
              <td style={{width: '60%', verticalAlign: 'top', padding: '10px'}}>
                <div className="check-grid row-mode" style={{marginBottom: '15px'}}>
                  <span style={{fontWeight: 'bold'}}>طريقة الدفع</span>
                  <label className="check-item"><span className={`check-box ${payment?.paymentMethod === 'نقدا' ? 'checked' : ''}`}></span> نقدا</label>
                  <label className="check-item"><span className={`check-box ${payment?.paymentMethod === 'تحويل بنكي' ? 'checked' : ''}`}></span> تحويل بنكي</label>
                  <label className="check-item"><span className={`check-box ${payment?.paymentMethod === 'صك' ? 'checked' : ''}`}></span> صك</label>
                  <label className="check-item"><span className={`check-box ${payment?.paymentMethod === 'حوالة' || payment?.paymentMethod === 'دفع إلكتروني' ? 'checked' : ''}`}></span> حوالة / دفع إلكتروني</label>
                  <label className="check-item"><span className={`check-box ${payment?.paymentMethod === 'أخرى' ? 'checked' : ''}`}></span> أخرى</label>
                </div>
                <div className="text-line">رقم العملية / الصك: <span className="dotted-line" style={{width: '60%'}}>{payment?.transactionNumber || ''}</span></div>
                <div className="text-line">تاريخ الدفع: {paymentDate || '......../....../......'}</div>
                <div className="text-line">الفترة / المناسبة: <span className="dotted-line" style={{width: '60%'}}>{payment?.occasion || ''}</span></div>
                <div className="text-line">الرصيد المتبقي - إن وجد: <span className="dotted-line" style={{width: '40%'}}>{remaining > 0 ? formatNum(remaining) : ''}</span> دج</div>
                <div className="text-line">ملاحظات: <span className="dotted-line" style={{width: '70%'}}>{payment?.notes || ''}</span></div>
              </td>
              <td style={{width: '40%', verticalAlign: 'top', padding: '10px'}}>
                <div style={{fontWeight: 'bold', color: '#F97316', marginBottom: '10px', textAlign: 'center'}}>طبيعة المبلغ</div>
                <div className="check-grid">
                  <label className="check-item">
                    <span className={`check-box ${payment?.amountNature === 'رقم دفعة' ? 'checked' : ''}`}></span> 
                    دفعة أولى &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span className="check-box"></span> دفعة ثانية &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span className="check-box"></span> دفعة ثالثة
                  </label>
                  <label className="check-item"><span className={`check-box ${payment?.amountNature === 'راتب شهري' || payment?.amountNature === 'راتب' ? 'checked' : ''}`}></span> راتب شهري</label>
                  <label className="check-item"><span className={`check-box ${payment?.amountNature === 'نتيجة' || payment?.amountNature === 'تحفيز' ? 'checked' : ''}`}></span> نتيجة / تحفيز</label>
                  <label className="check-item"><span className={`check-box ${payment?.amountNature === 'مستحقات' ? 'checked' : ''}`}></span> جزء من المستحقات / باقي المستحقات</label>
                  <label className="check-item"><span className={`check-box ${payment?.amountNature === 'تعويض مصاريف' || payment?.amountNature === 'إقامة' ? 'checked' : ''}`}></span> تعويض مصاريف / تنقل / إقامة / إطعام</label>
                  <label className="check-item">
                    <span className={`check-box ${payment?.amountNature === 'تسوية جزئية' ? 'checked' : ''}`}></span> تسوية جزئية &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span className={`check-box ${payment?.amountNature === 'تسوية نهائية' ? 'checked' : ''}`}></span> تسوية نهائية
                  </label>
                  <label className="check-item"><span className={`check-box ${payment?.amountNature === 'سلفة' || payment?.amountNature === 'إرجاع سلفة' ? 'checked' : ''}`}></span> سلفة / استرجاع مبلغ / أخرى: <span className="dotted-line" style={{flex: 1}}></span></label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="section-title">القيمة والتسوية</div>
        <table className="receipt-table" style={{textAlign: 'center'}}>
          <thead>
            <tr>
              <th>إجمالي الاستحقاق</th>
              <th>المدفوع سابقا</th>
              <th>الاستقطاعات</th>
              <th>صافي المدفوع</th>
              <th>الرصيد المتبقي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{contractValue > 0 ? formatNum(contractValue) : '.......................'} دج</td>
              <td>{totalPaid > 0 ? formatNum(totalPaid) : '.......................'} دج</td>
              <td>{deductions > 0 ? formatNum(deductions) : '.......................'} دج</td>
              <td>{amount > 0 ? formatNum(amount) : '.......................'} دج</td>
              <td>{remaining > 0 ? formatNum(remaining) : '.......................'} دج</td>
            </tr>
          </tbody>
        </table>

        <div style={{fontWeight: 'bold', margin: '15px 0', color: '#F97316'}}>
          صافي المبلغ بالحروف: <span className="dotted-line" style={{width: '70%'}}>{numberToArabicWords(amount)}</span> دينار جزائري
        </div>

        <div className="section-title">الإقـــــرار</div>
        <div className="declaration-text">
          أقر بأنني استلمت من النادي / الهيئة المذكورة أعلاه المبلغ الآتي: بالأرقام: <span className="dotted-line" style={{width: '150px'}}>{formatNum(amount)}</span> دج<br/>
          بالحروف: <span className="dotted-line" style={{width: '70%'}}>{numberToArabicWords(amount)}</span> دينار جـزائري<br/>
          أقر باستلام المبلغ المبين أعلاه فعليا وكاملا بالنسبة للقيمة المحددة في هذا الوصل، ويعد هذا الوصل إثباتا لاستلام هذا المبلغ فقط وفي حدود طبيعته وفترته المبينتين أعلاه. ولا يعد التوقيع عليه إبراء شاملا لبقية المستحقات أو تنازلا عن حقوق أخرى، إلا إذا تم اختيار «تسويـــــة نهائية» وبيان نطاقها صراحة. كما أقر بصحة البيانات وبأن أي شطب أو إضافة أو تعديل لا يعتمد إلا إذا صودق عليه بتوقيع الطرفين.
        </div>

        <div className="black-box">
          تكتب عبارة بخط يد المستفيد: "استلمت المبلغ المذكور أعلاه"<br/>
          كمــــا يــــرفق بهــذا الإقــــرار نسخة من بطاقة الهويـــــة
        </div>

        <div className="section-title">التوقيعــــــات</div>
        <table className="signature-table">
          <thead>
            <tr>
              <th>اسم وتوقيع رئيس الفرع</th>
              <th>اسم وتوقيع أمين المال</th>
              <th>اسم وتوقيع المستفيد</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});
