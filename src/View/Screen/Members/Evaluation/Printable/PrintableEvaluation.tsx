import React, { forwardRef } from 'react';
import './PrintableEvaluation.css';
import receiptBg from '../../../../../assets/receipt-template.png';

interface PrintableEvaluationProps {
  evaluation: any;
  player: any;
}

export const PrintableEvaluation = forwardRef<HTMLDivElement, PrintableEvaluationProps>(({ evaluation, player }, ref) => {
  if (!evaluation || !player) return null;

  return (
    <div ref={ref}>
      <div className="printable-evaluation-wrapper" dir="rtl">
        <img src={receiptBg} alt="Receipt Background" className="eval-receipt-bg-image" />
        
        <div className="eval-receipt-content">
          <div className="eval-receipt-main-title">
            استمارة تقييم لاعب — EVAL-01
          </div>

          <div className="eval-top-details">
            <div>الوادي في : {evaluation.evalDate || new Date().toLocaleDateString('en-GB')}</div>
            <div>الموسم الرياضي: {evaluation.season || 'غير محدد'}</div>
          </div>

          <div className="eval-section-title">بيانات اللاعب والتقييم</div>
          <table className="eval-receipt-table">
            <tbody>
              <tr>
                <td className="col-50">الاسم واللقب: <span>{player.first_name} {player.last_name}</span></td>
                <td className="col-50">الفئة / الفريق: <span>{player.team?.name || player.team_name || 'غير محدد'}</span></td>
              </tr>
              <tr>
                <td className="col-50">فترة التقييم: <span>{evaluation.period}</span></td>
                <td className="col-50">تاريخ التقييم: <span>{evaluation.evalDate}</span></td>
              </tr>
            </tbody>
          </table>

          <div className="eval-section-title">النقاط والعلامات التفصيلية</div>
          <div className="eval-score-grid">
            <div className="eval-score-item">
              <span>الانضباط والحضور:</span>
              <span>{evaluation.scores?.discipline || 0} / 10</span>
            </div>
            <div className="eval-score-item">
              <span>الجاهزية البدنية:</span>
              <span>{evaluation.scores?.physical || 0} / 15</span>
            </div>
            <div className="eval-score-item">
              <span>المستوى الفني:</span>
              <span>{evaluation.scores?.technical || 0} / 20</span>
            </div>
            <div className="eval-score-item">
              <span>الأداء التكتيكي:</span>
              <span>{evaluation.scores?.tactical || 0} / 15</span>
            </div>
            <div className="eval-score-item">
              <span>المردودية في المباريات:</span>
              <span>{evaluation.scores?.matchOutput || 0} / 20</span>
            </div>
            <div className="eval-score-item">
              <span>تنفيذ تعليمات الطاقم الفني:</span>
              <span>{evaluation.scores?.instructions || 0} / 10</span>
            </div>
            <div className="eval-score-item">
              <span>السلوك وروح المجموعة:</span>
              <span>{evaluation.scores?.behavior || 0} / 10</span>
            </div>
            <div className="eval-score-item total">
              <span>المجموع الكلي:</span>
              <span>{evaluation.totalScore || 0} / 100</span>
            </div>
          </div>

          <div className="eval-section-title">نقاط القوة</div>
          <div className="eval-text-box">
            {evaluation.strengths || 'لا توجد ملاحظات'}
          </div>

          <div className="eval-section-title">نقاط الضعف</div>
          <div className="eval-text-box">
            {evaluation.weaknesses || 'لا توجد ملاحظات'}
          </div>

          <div className="eval-section-title">توصيات المدرب وبرنامج التحسين</div>
          <div className="eval-text-box">
            {evaluation.recommendation || 'لا توجد ملاحظات'}
          </div>

          <table className="eval-signature-table">
            <thead>
              <tr>
                <th style={{ width: '33%' }}>إمضاء المدرب</th>
                <th style={{ width: '33%' }}>إمضاء المدير الرياضي</th>
                <th style={{ width: '33%' }}>إمضاء اللاعب / الولي</th>
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
    </div>
  );
});
