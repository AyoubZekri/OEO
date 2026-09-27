import React, { useEffect } from 'react';

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Saidpar } from './View/Screen/Saidpar/Saidpar';
import { MobileBottomNav } from './View/Mobile/MobileBottomNav/MobileBottomNav';
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
import { Correspondences } from './View/Screen/Correspondences/Correspondences';
import { Disciplinary } from './View/Screen/Disciplinary/Disciplinary';
import TrainingSessions from './View/Screen/TrainingSessions/TrainingSessions';
import { TakeAttendance } from './View/Screen/TrainingSessions/Attendance/TakeAttendance';
import { AbsenceRequests } from './View/Screen/Absence/AbsenceRequests';
import { Matches } from './View/Screen/Matches/Matches';
import { MatchAttendance } from './View/Screen/Matches/Attendance/TakeAttendance';
import { Medical } from './View/Screen/Medical/Medical';
import { Meetings } from './View/Screen/Meetings/Meetings';
import { TakeMeetingAttendance } from './View/Screen/Meetings/Attendance/TakeMeetingAttendance';
import { Decisions } from './View/Screen/Decisions/Decisions';
import { Clubs } from './View/Screen/Clubs/Clubs'; 
import { Operations } from './View/Screen/Operations/Operations';
import { MobileMore } from './View/Mobile/MobileMore/MobileMore';
import { Approutes } from './core/constant/routes';
import { Login } from './View/Screen/Auth/Login/Login';
import { useAuth } from './core/context/AuthContext';
import { useIsMobile } from './core/functions/useIsMobile';
import './App.css';

// Pages that draw their own app bar on phones, so the Topbar is hidden there
const MOBILE_APPBAR_PAGES = ['/', Approutes.Operations, Approutes.Members, Approutes.More, Approutes.Disciplinary, Approutes.Teams, Approutes.Clubs, Approutes.TrainingSessions, Approutes.Matches, Approutes.Meetings, Approutes.Decisions, Approutes.MedicalRecords, Approutes.Contracts];

const AppLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const controller = useSaidparController(onLogout);
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    console.log("Registered Route for Correspondences:", Approutes.Correspondences);
  }, [i18n.language]);

  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
      {!isMobile && <Saidpar controller={controller} />}
      {isMobile && <Saidpar controller={controller} />} {/* Sidebar still renders for the 'More' menu overlay */}
      
      <div style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: isMobile ? '82px' : '0' }}>
        {!(isMobile && MOBILE_APPBAR_PAGES.includes(location.pathname)) && <Topbar title={controller.activeItem} controller={controller} />}
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
            <Route path={Approutes.Correspondences} element={<Correspondences />} />
            <Route path={Approutes.Disciplinary} element={<Disciplinary />} />
            <Route path={Approutes.TrainingSessions} element={<TrainingSessions />} />
            <Route path={Approutes.TakeAttendance} element={<TakeAttendance />} />
            <Route path={Approutes.AbsenceRequests} element={<AbsenceRequests />} />
            <Route path={Approutes.Matches} element={<Matches />} />
            <Route path="/matches/:id/attendance" element={<MatchAttendance />} />
            <Route path={Approutes.MedicalRecords} element={<Medical />} />
            <Route path={Approutes.Meetings} element={<Meetings />} />
            <Route path="/meetings/:id/attendance" element={<TakeMeetingAttendance />} />
            <Route path={Approutes.Decisions} element={<Decisions />} />
            <Route path={Approutes.Clubs} element={<Clubs />} />
            {/* Phone-only pages: widening the screen sends the user to the desktop home */}
            <Route path={Approutes.Operations} element={isMobile ? <Operations /> : <Navigate to="/" replace />} />
            <Route path={Approutes.More} element={isMobile ? <MobileMore controller={controller} /> : <Navigate to="/" replace />} />
            {/* Add more routes here as needed */}
          </Routes>
        </div>
      </div>
      
      {isMobile && (
        <MobileBottomNav />
      )}
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


