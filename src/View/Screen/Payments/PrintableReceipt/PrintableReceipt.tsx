import { forwardRef } from 'react';
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

  const fullName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : payment?.occasion || '';
  const role = member?.memberRole || 'أخرى';
  
  const paymentDate = payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-GB') : '';
  const amount = Number(payment?.amount) || 0;
  
  const contractValue = contract ? (Number(contract.contractValue) || 0) : 0;
  
  const amountNatureRaw = payment?.amountNature || payment?.amount_nature || (payment as any)?.AmountNature || (payment as any)?.amount_Nature || '';
  const amountNature = String(amountNatureRaw).trim();
  
  let instNumVal = payment?.installmentNumber || (payment as any)?.Occasion_Reason_numper || (payment as any)?.occasion_reason_numper || (payment as any)?.Occasion_reason_numper;
  
  if (!instNumVal && amountNature === 'رقم دفعة') {
    instNumVal = payment?.checkNumber;
  }
  
  const instNum = String(instNumVal || '').trim();
  
  const isSalary = amountNature === 'راتب شهري' || amountNature === 'راتب';
  const isInstallment = amountNature === 'رقم دفعة' || !!(payment?.installmentNumber || (payment as any)?.Occasion_Reason_numper || (payment as any)?.occasion_reason_numper);
  const isResult = ['نتيجة', 'تحفيز', 'منحة مقابلات', 'تسجيل أهداف'].includes(amountNature);
  const isDues = ['مستحقات', 'جزء من المستحقات', 'باقي المستحقات'].includes(amountNature);
  const isCompensation = ['تعويض مصاريف', 'إقامة', 'تنقل', 'إطعام', 'مصاريف التنقل'].includes(amountNature);

  const getMonthName = (monthStr: string) => {
    const months: {[key: string]: string} = {
      '01': 'جانفي', '02': 'فيفري', '03': 'مارس', '04': 'أفريل',
      '05': 'ماي', '06': 'جوان', '07': 'جويلية', '08': 'أوت',
      '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
    };
    return months[monthStr] || monthStr;
  };

  let formattedOccasion = payment?.occasion || '';
  if (isSalary && formattedOccasion) {
    const parts = formattedOccasion.split('-');
    if (parts.length === 2) {
      const mStr = parts[0];
      const yStr = parts[1];
      const numMonths = payment?.numberOfMonths || (payment as any)?.Number_of_months || 1;
      
      if (numMonths > 3) {
        let currentMonthNum = parseInt(mStr);
        let currentYearNum = parseInt(yStr);
        let endMonthNum = currentMonthNum + numMonths - 1;
        let endYearNum = currentYearNum;
        
        while (endMonthNum > 12) {
          endMonthNum -= 12;
          endYearNum++;
        }
        
        const startMonthName = getMonthName(currentMonthNum.toString().padStart(2, '0'));
        const endMonthName = getMonthName(endMonthNum.toString().padStart(2, '0'));
        
        if (currentYearNum !== endYearNum) {
          formattedOccasion = `من شهر ${startMonthName} ${currentYearNum} إلى شهر ${endMonthName} ${endYearNum}`;
        } else {
          formattedOccasion = `من شهر ${startMonthName} إلى شهر ${endMonthName} - ${yStr}`;
        }
      } else if (numMonths > 1) {
        let currentMonthNum = parseInt(mStr);
        let currentYearNum = parseInt(yStr);
        const monthNames = [];
        for (let i = 0; i < numMonths; i++) {
          const formattedMonth = currentMonthNum.toString().padStart(2, '0');
          monthNames.push(getMonthName(formattedMonth));
          currentMonthNum++;
          if (currentMonthNum > 12) {
            currentMonthNum = 1;
            currentYearNum++;
          }
        }
        formattedOccasion = `${monthNames.join('، ')} - ${yStr}`;
      } else {
        formattedOccasion = `${getMonthName(mStr)}-${yStr}`;
      }
    }
  }
  const isPartialSettlement = amountNature === 'تسوية جزئية';
  const isFinalSettlement = amountNature === 'تسوية نهائية';
  const isLoan = amountNature === 'سلفة' || amountNature === 'إرجاع سلفة';
  
  const isOtherNature = !isSalary && !isInstallment && !isResult && !isDues && !isCompensation && !isPartialSettlement && !isFinalSettlement && !isLoan && amountNature !== '';
  
  const paddedId = payment?.id ? String(payment.id).padStart(4, '0') : '';
  
  // Format numbers exactly as requested (matching the Payments page format: 20.000,00)
  const formatNum = (num?: number | string | null) => {
    const amountVal = Number(num) || 0;
    const numStr = amountVal.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    return numStr.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.');
  };

  const getOrdinal = (num: any) => {
    const strNum = String(num).trim();
    const ordinals: Record<string, string> = {
      '1': 'الأولى',
      '2': 'الثانية',
      '3': 'الثالثة',
      '4': 'الرابعة',
      '5': 'الخامسة',
      '6': 'السادسة',
      '7': 'السابعة',
      '8': 'الثامنة',
      '9': 'التاسعة',
      '10': 'العاشرة'
    };
    return ordinals[strNum] || `رقم ${strNum}`;
  };

  return (
    <div className="receipt-wrapper" ref={ref}>
      <img src={receiptBg} alt="Receipt Background" className="receipt-bg-image" />
      
      <div className="receipt-content">
        <div className="receipt-main-title">
          سند صرف وإقرار باستلام مبلغ مالي
        </div>

        <div className="top-details">
          <div>الوادي في : {paymentDate}</div>
          <div>رقم الوصل: {paddedId}</div>
        </div>

        <div className="section-title">بيانات المستفيد</div>
        <table className="receipt-table">
          <tbody>
            <tr>
              <td className="col-50">الاسم واللقب: <span style={{fontWeight: 'normal'}}>{fullName}</span></td>
              <td className="col-50">الصفة: <span style={{fontWeight: 'normal'}}>{role}</span></td>
            </tr>
            <tr>
              <td>رقم بطاقة الهوية : <span style={{fontWeight: 'normal'}}>{member?.nationalId || ''}</span></td>
              <td>رقم العقد أو الاتفاقية: <span style={{fontWeight: 'normal'}}>{contract?.id || ''}</span></td>
            </tr>
            <tr>
              <td>تاريخ ومكان الميلاد: <span style={{fontWeight: 'normal'}}>{member?.dateOfBirth?.split('T')[0] || ''} {member?.placeOfBirth || ''}</span></td>
              <td>رقم الهاتف: <span style={{fontWeight: 'normal'}}>{member?.phoneNumber || ''}</span></td>
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
                <div className="text-line">رقم العملية: <span style={{fontWeight: 'normal'}}>{payment?.transactionNumber || paddedId}</span></div>
                {(payment?.postal_check || payment?.paymentMethod === 'صك' || payment?.paymentMethod === 'تحويل بنكي' || payment?.paymentMethod === 'حوالة' || payment?.paymentMethod === 'دفع إلكتروني') && (
                  <div className="text-line">رقم الصك: <span style={{fontWeight: 'normal'}}>{payment?.postal_check || ''}</span></div>
                )}
                <div className="text-line">تاريخ الدفع: <span style={{fontWeight: 'normal'}}>{paymentDate}</span></div>

                <div className="text-line">المناسبة: <span style={{fontWeight: 'normal'}}>{formattedOccasion || (!isInstallment ? payment?.checkNumber : '') || ''}</span></div>
                <div className="text-line">ملاحظات: <span style={{fontWeight: 'normal'}}>{payment?.notes || ''}</span></div>
              </td>
              <td style={{width: '40%', verticalAlign: 'top', padding: '10px'}}>
                <div style={{fontWeight: 'bold', color: '#F97316', marginBottom: '10px', textAlign: 'center'}}>طبيعة المبلغ</div>
                <div className="check-grid">
                  <label className="check-item">
                    <span className={`check-box ${isInstallment ? 'checked' : ''}`}></span> {isInstallment && instNum ? `الدفعة ${getOrdinal(instNum)}` : 'رقم الدفعة'}
                  </label>
                  <label className="check-item"><span className={`check-box ${isSalary ? 'checked' : ''}`}></span> راتب شهري / منحة شهرية: <span style={{fontWeight: 'normal', paddingRight: '5px'}}>{isSalary ? formattedOccasion || payment?.checkNumber : ''}</span></label>
                  <label className="check-item"><span className={`check-box ${isResult ? 'checked' : ''}`}></span> {isResult ? amountNature : 'نتيجة / تحفيز'}</label>
                  <label className="check-item"><span className={`check-box ${isDues ? 'checked' : ''}`}></span> {isDues ? amountNature : 'جزء من المستحقات / باقي المستحقات'}</label>
                  <label className="check-item"><span className={`check-box ${isCompensation ? 'checked' : ''}`}></span> {isCompensation ? amountNature : 'تعويض مصاريف / مصاريف التنقل / إقامة / إطعام'}</label>
                  <label className="check-item">
                    <span className={`check-box ${isPartialSettlement ? 'checked' : ''}`}></span> تسوية جزئية &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span className={`check-box ${isFinalSettlement ? 'checked' : ''}`}></span> تسوية نهائية
                  </label>
                  <label className="check-item">
                    <span className={`check-box ${isLoan || isOtherNature ? 'checked' : ''}`}></span> سلفة / استرجاع مبلغ / أخرى: <span style={{fontWeight: 'normal', paddingRight: '5px'}}>{isOtherNature ? (payment?.amountNature === 'اخرى' ? payment?.occasion : payment?.amountNature) : ''}</span>
                  </label>
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
              <td>{formatNum(contractValue)} دج</td>
              <td>{formatNum(totalPaid - amount)} دج</td>
              <td>{formatNum(deductions)} دج</td>
              <td>{formatNum(amount)} دج</td>
              <td>{formatNum(remaining)} دج</td>
            </tr>
          </tbody>
        </table>

        <div style={{fontWeight: 'bold', margin: '15px 0', color: '#F97316'}}>
          صافي المبلغ بالحروف: <span style={{fontWeight: 'normal'}}>{numberToArabicWords(amount)}</span> دينار جزائري
        </div>

        <div className="section-title">الإقـــــرار</div>
        <div className="declaration-text">
          أقر بأنني استلمت من النادي / الهيئة المذكورة أعلاه المبلغ الآتي: بالأرقام: <span style={{fontWeight: 'normal'}}>{formatNum(amount)}</span> دج<br/>
          بالحروف: <span style={{fontWeight: 'normal'}}>{numberToArabicWords(amount)}</span> دينار جـزائري<br/>
          أقر باستلام المبلغ المبين أعلاه فعليا وكاملا بالنسبة للقيمة المحددة في هذا الوصل، ويعد هذا الوصل إثباتا لاستلام هذا المبلغ فقط وفي حدود طبيعته وفترته المبينتين أعلاه. ولا يعد التوقيع عليه إبراء شاملا لبقية المستحقات أو تنازلا عن حقوق أخرى، إلا إذا تم اختيار «تسويـــــة نهائية» وبيان نطاقها صراحة. كما أقر بصحة البيانات وبأن أي شطب أو إضافة أو تعديل لا يعتمد إلا إذا صودق عليه بتوقيع الطرفين.
        </div>

        <div className="handwriting-box">
             <div className="handwriting-title">إعادة كتابة العبارة بخط يد المستفيد: "استلمت المبلغ المذكور أعلاه"</div>
             <div className="handwriting-line"></div>
             <div className="handwriting-footer">كمــــا يــــرفق بهــذا الإقــــرار نسخة من بطاقة الهويـــــة</div>
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
