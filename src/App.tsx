import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Saidpar } from './View/Screen/Saidpar/Saidpar';
import { useSaidparController } from './View/Screen/Saidpar/SaidparController';
import { Roles } from './View/Screen/UserManagement/Roles/Roles';
import { Users } from './View/Screen/UserManagement/Users/Users';
import { Topbar } from './View/Screen/Topbar/Topbar';
import { Home } from './View/Screen/Home/Home';
import { Members } from './View/Screen/Members/Members';
import { Contracts } from './View/Screen/Contracts/Contracts';
import { Teams } from './View/Screen/Teams/Teams';
import { Payments } from './View/Screen/Payments/Payments';
import { Funds } from './View/Screen/Funds/Funds';
import { Reports } from './View/Screen/Reports/Reports';
import { Equipment } from './View/Screen/Equipment/Equipment';
import { EquipmentOperations } from './View/Screen/Equipment/EquipmentOperations';
import { Approutes } from './core/constant/routes';
import { Login } from './View/Screen/Auth/Login/Login';
import { useAuth } from './core/context/AuthContext';
import './App.css';

const AppLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const controller = useSaidparController(onLogout);
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
      <Saidpar controller={controller} />
      <div style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Topbar title={controller.activeItem} controller={controller} />
        <div style={{ padding: '20px', flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path={Approutes.Roles} element={<Roles />} />
            <Route path={Approutes.Users} element={<Users />} />
            <Route path={Approutes.Members} element={<Members />} />
            <Route path={Approutes.Contracts} element={<Contracts />} />
            <Route path={Approutes.Payments} element={<Payments />} />
            <Route path={Approutes.Funds} element={<Funds />} />
            <Route path={Approutes.Reports} element={<Reports />} />
            <Route path={Approutes.Teams} element={<Teams />} />
            <Route path={Approutes.Equipment} element={<Equipment />} />
            <Route path={Approutes.EquipmentOperations} element={<EquipmentOperations />} />
            {/* Add more routes here as needed */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Login onLoginSuccess={() => {}} />
      ) : (
        <AppLayout onLogout={logout} />
      )}
    </BrowserRouter>
  );
}

export default App;
