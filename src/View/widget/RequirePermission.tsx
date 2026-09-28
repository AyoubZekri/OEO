import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useCan } from '../../core/functions/useCan';
import type { PermissionModule } from '../Screen/UserManagement/Roles/role_model';
import './RequirePermission.css';

interface RequirePermissionProps {
  module: PermissionModule;
  /** Defaults to opening the page ("view") */
  action?: string;
  children: React.ReactNode;
}

// Shows the page only when the role allows it; otherwise a short "no access" message
export const RequirePermission: React.FC<RequirePermissionProps> = ({ module, action = 'view', children }) => {
  const can = useCan();
  if (can(module, action)) return <>{children}</>;

  return (
    <div className="rp-denied" role="alert">
      <span className="rp-icon"><ShieldAlert size={34} /></span>
      <h2>لا تملك صلاحية الوصول إلى هذه الصفحة</h2>
      <p>تواصل مع مسؤول النظام لتعديل صلاحيات دورك.</p>
      <Link to="/" className="rp-home">العودة إلى الرئيسية</Link>
    </div>
  );
};
