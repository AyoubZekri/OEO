import React, { useEffect, useState } from 'react';
import { moneyText, amountText } from '../MobileContracts/contractUtils';
import { useNavigate } from 'react-router-dom';
import { Users, Landmark, Wallet, TrendingDown, CalendarClock, History, ChevronLeft } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import { parseMatchDate } from '../../Screen/Home/HomeController';
import type { useHomeController } from '../../Screen/Home/HomeController';
import { MobileAppBar } from '../widgets/MobileAppBar';
import './MobileHome.css';

interface MobileHomeProps {
  controller: ReturnType<typeof useHomeController>;
}

const CLUB_NAME = 'أولمبيك الوادي';

// Same amount format as the desktop home
const formatDzd = moneyText;

const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

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
  const expenseParts = [
    { key: 'players', label: 'اللاعبون', value: metrics.paidToPlayers },
    { key: 'staff', label: 'الطاقم', value: metrics.paidToStaff },
    { key: 'other', label: 'أخرى', value: metrics.otherExpenses },
  ];
  const match = dashboard.nextMatch;
  const matchDate = parseMatchDate(match?.match_date);
  const countdown = useCountdown(matchDate);

  const opponentClub = match?.opponent_club || match?.opponentClub;
  const opponentName = opponentClub?.name || match?.opponent || '—';

  return (
    <div className="mobile-home" dir="ltr">
      {/* App bar */}
      <MobileAppBar title="الصفحة الرئيسية" showNotificationDot={dashboard.overdueContracts > 0} />

      {/* Funds balance */}
      <section className="mh-funds" dir="rtl">
        <img className="mh-funds-watermark" src="/LOGO.webp" alt="" aria-hidden="true" />
        <div className="mh-funds-top">
          <span className="mh-funds-icon"><Landmark size={20} /></span>
          <span className="mh-funds-label">إجمالي رصيد الصناديق</span>
        </div>
        <div className="mh-funds-total" dir="ltr">
          <span className="mh-funds-value">{amountText(metrics.totalBalance)}</span>
          <span className="mh-funds-currency">د.ج</span>
        </div>
        <div className="mh-funds-bottom">
          <span>نادي {CLUB_NAME}</span>
          <span className="mh-funds-chip">رصيد متاح</span>
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

      {/* Expenses breakdown */}
      <section className="mh-card mh-expenses">
        <div className="mh-match-head">
          <div className="mh-card-head">
            <span className="mh-icon mh-icon-orange"><Wallet size={18} /></span>
            <span className="mh-card-title">المصاريف منذ بداية الموسم</span>
          </div>
        </div>
        <div className="mh-expenses-total">{formatDzd(metrics.totalExpenses)}</div>
        <div className="mh-stack">
          {expenseParts.map(p => (
            <span key={p.key} className={`mh-stack-${p.key}`} style={{ flexGrow: p.value || 0 }} />
          ))}
        </div>
        <ul className="mh-legend" dir="rtl">
          {expenseParts.map(p => (
            <li key={p.key}>
              <span className={`mh-dot mh-stack-${p.key}`} />
              <span className="mh-legend-label">{p.label}</span>
              <span className="mh-legend-pct">{percent(p.value, metrics.totalExpenses)}%</span>
              <strong dir="ltr">{formatDzd(p.value)}</strong>
            </li>
          ))}
        </ul>
      </section>

      {/* Debts & upcoming dues */}
      <div className="mh-duo">
        <section className="mh-card mh-tile danger">
          <span className="mh-icon mh-icon-red"><TrendingDown size={18} /></span>
          <span className="mh-tile-label" dir="rtl">إجمالي الديون</span>
          <strong>{formatDzd(metrics.totalDebts)}</strong>
        </section>
        <section className="mh-card mh-tile warning">
          <span className="mh-icon mh-icon-yellow"><CalendarClock size={18} /></span>
          <span className="mh-tile-label" dir="rtl">المستحقات القادمة</span>
          <strong>{formatDzd(metrics.upcomingEntitlements)}</strong>
        </section>
      </div>

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
