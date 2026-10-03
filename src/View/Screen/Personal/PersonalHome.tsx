import React from 'react';
import { UserRound, Sparkles, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { useSpace } from '../../../core/context/space';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileAppBar } from '../../Mobile/widgets/MobileAppBar';
import './Personal.css';

/** Home of the personal space: empty for now, its pages are added step by step */
export const PersonalHome: React.FC<{ onSwitch?: () => void }> = ({ onSwitch }) => {
  const { user } = useAuth();
  const { canManage } = useSpace();
  const isMobile = useIsMobile();
  const name = user?.name || 'المستخدم';

  return (
    <div className={`ps-page ${isMobile ? 'mobile' : ''}`}>
      {isMobile && <MobileAppBar title="فضائي الشخصي" />}

      <section className="ps-welcome">
        <span className="ps-avatar">{name.charAt(0).toUpperCase()}</span>
        <div>
          <small>فضائي الشخصي</small>
          <h2>مرحباً، {name}</h2>
        </div>
      </section>

      <section className="ps-empty">
        <span className="ps-empty-icon"><Sparkles size={30} /></span>
        <h3>فضاؤك الشخصي جاهز</h3>
        <p>ستظهر هنا قريباً الأشياء الخاصة بك.</p>
        {canManage && onSwitch && (
          <button type="button" className="ps-switch" onClick={onSwitch}>
            <LayoutDashboard size={17} />التبديل إلى فضاء التسيير
          </button>
        )}
      </section>

      {!canManage && (
        <p className="ps-note"><UserRound size={14} />حسابك لا يملك صلاحيات التسيير، لذلك تعمل في فضائك الشخصي.</p>
      )}
    </div>
  );
};
