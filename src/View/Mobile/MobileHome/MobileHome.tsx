import React, { useEffect, useState } from 'react';
import { amountText } from '../MobileContracts/contractUtils';
import { useNavigate } from 'react-router-dom';
import { Users, Wallet, History, ChevronLeft } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import { parseMatchDate } from '../../Screen/Home/HomeController';
import type { useHomeController } from '../../Screen/Home/HomeController';
import { MobileAppBar } from '../widgets/MobileAppBar';
import './MobileHome.css';
import { HomeFinance } from '../../Screen/Home/HomeFinance';

interface MobileHomeProps {
  controller: ReturnType<typeof useHomeController>;
}

const CLUB_NAME = 'أولمبيك الوادي';

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

const useCountdown = (target: Date | null) => {
  const [now, setNow] = useState(() => Date.now());
  const targetTime = target?.getTime() ?? null;
  useEffect(() => {
    if (targetTime === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  const diff = targetTime !== null ? Math.max(0, targetTime - now) : 0;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

export const MobileHome: React.FC<MobileHomeProps> = ({ controller }) => {
  const navigate = useNavigate();
  const { dashboard, metrics } = controller;
  const match = dashboard.nextMatch;
  const matchDate = parseMatchDate(match?.match_date);
  const countdown = useCountdown(matchDate);

  const opponentClub = match?.opponent_club || match?.opponentClub;
  const opponentName = opponentClub?.name || match?.opponent || '—';

  return (
    <div className="mobile-home" dir="ltr">
      {/* App bar */}
      <MobileAppBar title="الصفحة الرئيسية" showNotificationDot={dashboard.overdueContracts > 0} />

      {/* Spent since the start of the season */}
      <section className="mh-funds" dir="rtl" role="button" tabIndex={0} onClick={() => navigate(Approutes.Payments)} onKeyDown={e => { if (e.key === 'Enter') navigate(Approutes.Payments); }}>
        <img className="mh-funds-watermark" src="/LOGO.webp" alt="" aria-hidden="true" />
        <div className="mh-funds-top">
          <span className="mh-funds-icon"><Wallet size={20} /></span>
          <span className="mh-funds-label">إجمالي المصروف منذ بداية الموسم</span>
        </div>
        <div className="mh-funds-total" dir="ltr">
          <span className="mh-funds-value">{amountText(metrics.totalExpenses)}</span>
          <span className="mh-funds-currency">د.ج</span>
        </div>
        <div className="mh-funds-bottom">
          <span>نادي {CLUB_NAME}</span>
        </div>
      </section>

      {/* Next match */}
      <section className="mh-card mh-match">
        <div className="mh-match-head">
          <div className="mh-card-head">
            <span className="mh-icon mh-icon-green"><Users size={18} /></span>
            <span className="mh-card-title">المباراة القادمة</span>
          </div>
          {match?.competition && <span className="mh-league">{match.competition}</span>}
        </div>

        {match && matchDate ? (
          <>
            <div className="mh-teams">
              <div className="mh-team">
                <img src="/LOGO.webp" alt={CLUB_NAME} />
                <span>{CLUB_NAME}</span>
              </div>
              <span className="mh-vs">VS</span>
              <div className="mh-team">
                {opponentClub?.logo ? (
                  <img src={opponentClub.logo} alt={opponentName} />
                ) : (
                  <span className="mh-team-placeholder">{opponentName.charAt(0)}</span>
                )}
                <span>{opponentName}</span>
              </div>
            </div>

            <div className="mh-match-meta" dir="rtl">
              <span>
                {new Intl.DateTimeFormat('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Algiers' }).format(matchDate)}
              </span>
              {match.location && <span>{match.location}</span>}
            </div>

            <div className="mh-countdown">
              <div><strong>{pad(countdown.days)}</strong><span>أيام</span></div>
              <div><strong>{pad(countdown.hours)}</strong><span>ساعات</span></div>
              <div><strong>{pad(countdown.minutes)}</strong><span>دقائق</span></div>
              <div><strong>{pad(countdown.seconds)}</strong><span>ثواني</span></div>
            </div>
          </>
        ) : (
          <p className="mh-empty" dir="rtl">لا توجد مباراة مبرمجة حالياً</p>
        )}
      </section>

      {/* Each fund's income and outgoings, the unpaid debts */}
      <HomeFinance mobile flows={controller.fundFlows} unfunded={controller.unfundedOutcome} loans={controller.unpaidLoans} credit={controller.unpaidCredit} money={controller.formatCurrency} />

      {/* Operations page shortcut */}
      <button className="mh-card mh-ops-link" onClick={() => navigate(Approutes.Operations)}>
        <ChevronLeft size={20} />
        <span className="mh-ops-text" dir="rtl">
          <strong>آخر العمليات</strong>
          <small>كل الواردات والمصاريف والتحويلات</small>
        </span>
        <span className="mh-icon mh-icon-orange"><History size={18} /></span>
      </button>
    </div>
  );
};
