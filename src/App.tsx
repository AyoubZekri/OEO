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
import { RequirePermission } from './View/widget/RequirePermission';
import { Teams } from './View/Screen/Teams/Teams';
import { Payments } from './View/Screen/Payments/Payments';
import { Funds } from './View/Screen/Funds/Funds';
import { Debts } from './View/Screen/Debts/Debts';
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
import { Tasks } from './View/Screen/Tasks/Tasks';
import { PeriodicTasks } from './View/Screen/Tasks/PeriodicTasks';
import { Travels } from './View/Screen/Travels/Travels';
import { MobileMore } from './View/Mobile/MobileMore/MobileMore';
import { Approutes } from './core/constant/routes';
import { Login } from './View/Screen/Auth/Login/Login';
import { useAuth } from './core/context/AuthContext';
import { SpaceProvider } from './core/context/SpaceContext';
import { useSpace } from './core/context/space';
import { MyTasks } from './View/Screen/Personal/MyTasks';
import { MyDisciplinary } from './View/Screen/Personal/MyDisciplinary';
import { MyTrainingSessions } from './View/Screen/Personal/MyTrainingSessions';
import { MyMatches } from './View/Screen/Personal/MyMatches';
import { MyAbsences } from './View/Screen/Personal/MyAbsences';
import { MyMeetings } from './View/Screen/Personal/MyMeetings';
import { MyTravels } from './View/Screen/Personal/MyTravels';
import { MyMedical } from './View/Screen/Personal/MyMedical';
import { TaskAlerts } from './View/widget/TaskAlerts/TaskAlertStack';
import { useIsMobile } from './core/functions/useIsMobile';
import './App.css';

// Pages that draw their own app bar on phones, so the Topbar is hidden there
const MOBILE_APPBAR_PAGES = ['/', Approutes.Operations, Approutes.Members, Approutes.More, Approutes.Disciplinary, Approutes.Teams, Approutes.Clubs, Approutes.TrainingSessions, Approutes.Matches, Approutes.Meetings, Approutes.Decisions, Approutes.MedicalRecords, Approutes.Contracts, Approutes.Payments, Approutes.Funds, Approutes.Debts, Approutes.Reports, Approutes.Equipment, Approutes.EquipmentOperations, Approutes.Roles, Approutes.Users, Approutes.AbsenceRequests, Approutes.Tasks, Approutes.PeriodicTasks, Approutes.Travels, Approutes.MyTasks, Approutes.MyDisciplinary, Approutes.MyTrainingSessions, Approutes.MyMatches, Approutes.MyAbsences, Approutes.MyMeetings, Approutes.MyTravels, Approutes.MyMedical];

const AppLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const controller = useSaidparController(onLogout);
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    console.log("Registered Route for Correspondences:", Approutes.Correspondences);
  }, [i18n.language]);

  const isMobile = useIsMobile();
  const { space } = useSpace();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
      {!isMobile && <Saidpar controller={controller} />}
      {isMobile && <Saidpar controller={controller} />} {/* Sidebar still renders for the 'More' menu overlay */}
      
      <div style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: isMobile ? '82px' : '0' }}>
        {!(isMobile && MOBILE_APPBAR_PAGES.includes(location.pathname)) && <Topbar title={controller.activeItem} controller={controller} />}
        <div style={{ padding: '20px', flex: 1 }}>
          {space === 'personal' ? (
            <Routes>
              {/* No home page in the personal space: it opens on my tasks */}
              <Route path="/" element={<Navigate to={Approutes.MyTasks} replace />} />
              <Route path={Approutes.MyTasks} element={<MyTasks />} />
              <Route path={Approutes.MyTrainingSessions} element={<MyTrainingSessions />} />
              <Route path={Approutes.MyMatches} element={<MyMatches />} />
              <Route path={Approutes.MyAbsences} element={<MyAbsences />} />
              <Route path={Approutes.MyMeetings} element={<MyMeetings />} />
              <Route path={Approutes.MyTravels} element={<MyTravels />} />
              <Route path={Approutes.MyMedical} element={<MyMedical />} />
              <Route path={Approutes.MyDisciplinary} element={<MyDisciplinary />} />
              <Route path={Approutes.More} element={isMobile ? <MobileMore controller={controller} /> : <Navigate to="/" replace />} />
              {/* The management pages are not part of the personal space */}
              <Route path="*" element={<Navigate to={Approutes.MyTasks} replace />} />
            </Routes>
          ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path={Approutes.Roles} element={<RequirePermission module="usersAndRoles" action="viewRoles"><Roles /></RequirePermission>} />
            <Route path={Approutes.Users} element={<RequirePermission module="usersAndRoles" action="viewUsers"><Users /></RequirePermission>} />
            <Route path={Approutes.Members} element={<RequirePermission module="members"><Members /></RequirePermission>} />
            <Route path={Approutes.Contracts} element={<RequirePermission module="contracts"><Contracts /></RequirePermission>} />
            <Route path={Approutes.Payments} element={<RequirePermission module="payments"><Payments /></RequirePermission>} />
            <Route path={Approutes.Funds} element={<RequirePermission module="funds"><Funds /></RequirePermission>} />
            <Route path={Approutes.Debts} element={<RequirePermission module="debts"><Debts /></RequirePermission>} />
            <Route path={Approutes.Reports} element={<RequirePermission module="reports"><Reports /></RequirePermission>} />
            <Route path={Approutes.Teams} element={<RequirePermission module="teams"><Teams /></RequirePermission>} />
            <Route path={Approutes.Equipment} element={<RequirePermission module="equipment"><Equipment /></RequirePermission>} />
            <Route path={Approutes.EquipmentOperations} element={<RequirePermission module="equipmentOperations"><EquipmentOperations /></RequirePermission>} />
            <Route path={Approutes.Correspondences} element={<RequirePermission module="correspondences"><Correspondences /></RequirePermission>} />
            <Route path={Approutes.Disciplinary} element={<RequirePermission module="disciplinary"><Disciplinary /></RequirePermission>} />
            <Route path={Approutes.TrainingSessions} element={<RequirePermission module="trainingSessions"><TrainingSessions /></RequirePermission>} />
            <Route path={Approutes.TakeAttendance} element={<RequirePermission module="trainingSessions" action="attendance"><TakeAttendance /></RequirePermission>} />
            <Route path={Approutes.AbsenceRequests} element={<RequirePermission module="absences"><AbsenceRequests /></RequirePermission>} />
            <Route path={Approutes.Matches} element={<RequirePermission module="matches"><Matches /></RequirePermission>} />
            <Route path="/matches/:id/attendance" element={<RequirePermission module="matches" action="attendance"><MatchAttendance /></RequirePermission>} />
            <Route path={Approutes.MedicalRecords} element={<RequirePermission module="medical"><Medical /></RequirePermission>} />
            <Route path={Approutes.Meetings} element={<RequirePermission module="meetings"><Meetings /></RequirePermission>} />
            <Route path="/meetings/:id/attendance" element={<RequirePermission module="meetings" action="attendance"><TakeMeetingAttendance /></RequirePermission>} />
            <Route path={Approutes.Decisions} element={<RequirePermission module="decisions"><Decisions /></RequirePermission>} />
            <Route path={Approutes.Clubs} element={<RequirePermission module="clubs"><Clubs /></RequirePermission>} />
            <Route path={Approutes.Tasks} element={<RequirePermission module="tasks"><Tasks /></RequirePermission>} />
            <Route path={Approutes.PeriodicTasks} element={<RequirePermission module="tasks"><PeriodicTasks /></RequirePermission>} />
            <Route path={Approutes.Travels} element={<RequirePermission module="travels"><Travels /></RequirePermission>} />
            {/* Phone-only pages: widening the screen sends the user to the desktop home */}
            <Route path={Approutes.Operations} element={isMobile ? <Operations /> : <Navigate to="/" replace />} />
            <Route path={Approutes.More} element={isMobile ? <MobileMore controller={controller} /> : <Navigate to="/" replace />} />
            {/* Add more routes here as needed */}
          </Routes>
          )}
        </div>
      </div>
      
      {isMobile && (
        <MobileBottomNav />
      )}

      {/* Alerts about the user's tasks, on every page */}
      <TaskAlerts />
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
        <SpaceProvider>
          <AppLayout onLogout={logout} />
        </SpaceProvider>
      )}
    </BrowserRouter>
  );
}

export default App;


