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
import { Operations } from './View/Screen/Operations/Operations';
import { Travels } from './View/Screen/Travels/Travels';
import { MobileMore } from './View/Mobile/MobileMore/MobileMore';
import { Approutes } from './core/constant/routes';
import { Login } from './View/Screen/Auth/Login/Login';
import { useAuth } from './core/context/AuthContext';
import { SpaceProvider } from './core/context/SpaceContext';
import { useSpace } from './core/context/space';
import { MyDisciplinary } from './View/Screen/Personal/MyDisciplinary';
import { MyTrainingSessions } from './View/Screen/Personal/MyTrainingSessions';
import { MyMatches } from './View/Screen/Personal/MyMatches';
import { MyAbsences } from './View/Screen/Personal/MyAbsences';
import { MyMeetings } from './View/Screen/Personal/MyMeetings';
import { MyTravels } from './View/Screen/Personal/MyTravels';
import { MyMedical } from './View/Screen/Personal/MyMedical';
import { MyFeedback } from './View/Screen/Feedback/MyFeedback';
import { FeedbackAdmin } from './View/Screen/Feedback/FeedbackAdmin';
import { Goals } from './View/Screen/Goals/Goals';
import { TasksHome } from './View/Screen/Tasks/TasksHome';
import { HomeTasks } from './View/Screen/Tasks/HomeTasks';
import { useCan } from './core/functions/useCan';
import { MyHome } from './View/Screen/Tasks/MyHome';
import { MyAppointments } from './View/Screen/Tasks/MyAppointments';
import { TaskAlerts } from './View/widget/TaskAlerts/TaskAlertStack';
import { useIsMobile } from './core/functions/useIsMobile';
import { usePushNotifications } from './core/functions/usePushNotifications';
import { useBackButton } from './core/functions/useBackButton';
import './App.css';
import { DocViewerHost } from './View/widget/DocViewer';

// Pages that draw their own app bar on phones, so the Topbar is hidden there
const MOBILE_APPBAR_PAGES = ['/', Approutes.Operations, Approutes.Members, Approutes.More, Approutes.Disciplinary, Approutes.Teams, Approutes.Clubs, Approutes.TrainingSessions, Approutes.Matches, Approutes.Meetings, Approutes.Decisions, Approutes.MedicalRecords, Approutes.Contracts, Approutes.Payments, Approutes.Funds, Approutes.Debts, Approutes.Reports, Approutes.Equipment, Approutes.EquipmentOperations, Approutes.Roles, Approutes.Users, Approutes.AbsenceRequests, Approutes.Travels, Approutes.MyDisciplinary, Approutes.MyTrainingSessions, Approutes.MyMatches, Approutes.MyAbsences, Approutes.MyMeetings, Approutes.MyTravels, Approutes.MyMedical, Approutes.MyFeedback, Approutes.Feedback, Approutes.Goals, Approutes.MyTasks, Approutes.Tasks, Approutes.Finance];

/**
 * The management's home page (the personal space has none): with the tasks permission, every task whose time came —
 * mine and the others' — on the same page; without it, mine only
 */
const HomeRoute: React.FC = () => {
  const can = useCan();
  return can('tasks') ? <HomeTasks /> : <MyHome />;
};

/** The management's appointments page, the same way: with the appointments permission all of them; without it, mine */
const AppointmentsRoute: React.FC = () => {
  const can = useCan();
  return can('appointments') ? <TasksHome /> : <MyAppointments />;
};

/** The management's training sessions, the same way: with their permission all of them; without it, mine */
const TrainingSessionsRoute: React.FC = () => {
  const can = useCan();
  return can('trainingSessions') ? <TrainingSessions /> : <MyTrainingSessions />;
};

/** The management's matches, the same way: with their permission all of them; without it, mine */
const MatchesRoute: React.FC = () => {
  const can = useCan();
  return can('matches') ? <Matches /> : <MyMatches />;
};

/** The management's opinions, one page: with their permission everyone's (and mine sent from it); without it, mine */
const FeedbackRoute: React.FC = () => {
  const can = useCan();
  return can('feedback') ? <FeedbackAdmin /> : <MyFeedback />;
};

/** The management's meetings, the same way: with their permission all of them; without it, mine */
const MeetingsRoute: React.FC = () => {
  const can = useCan();
  return can('meetings') ? <Meetings /> : <MyMeetings />;
};

/** The management's trips, the same way: with their permission all of them; without it, mine */
const TravelsRoute: React.FC = () => {
  const can = useCan();
  return can('travels') ? <Travels /> : <MyTravels />;
};

const AppLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const controller = useSaidparController(onLogout);
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const isMobile = useIsMobile();
  // One space per account: the management one for who has a role there, the personal one for who has none.
  // In the personal one, a player has no home page nor appointments (it opens on the training sessions), and someone
  // who is not a player no medical reports
  const { space, isPlayer } = useSpace();
  const personalStart = isPlayer ? Approutes.MyTrainingSessions : '/';
  // The Android app: this phone's notifications, and its back button (back a step, never closing the app)
  usePushNotifications();
  useBackButton();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
      {!isMobile && <Saidpar controller={controller} />}
      {isMobile && <Saidpar controller={controller} />} {/* Sidebar still renders for the 'More' menu overlay */}
      
      <div style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: isMobile ? '82px' : '0' }}>
        {!(isMobile && MOBILE_APPBAR_PAGES.includes(location.pathname)) && <Topbar title={controller.activeItem} controller={controller} />}
        <div style={{ padding: '20px', flex: 1 }}>
          {space === 'personal' ? (
            <Routes>
              {/* My tasks' home page, only for someone without the management space (theirs is there) */}
              <Route path="/" element={isPlayer ? <Navigate to={personalStart} replace /> : <MyHome />} />
              <Route path={Approutes.MyTrainingSessions} element={<MyTrainingSessions />} />
              <Route path={Approutes.MyMatches} element={<MyMatches />} />
              <Route path={Approutes.MyAbsences} element={<MyAbsences />} />
              <Route path={Approutes.MyMeetings} element={<MyMeetings />} />
              <Route path={Approutes.MyTravels} element={<MyTravels />} />
              <Route path={Approutes.MyMedical} element={isPlayer ? <MyMedical /> : <Navigate to={personalStart} replace />} />
              <Route path={Approutes.MyDisciplinary} element={<MyDisciplinary />} />
              <Route path={Approutes.MyFeedback} element={<MyFeedback />} />
              {/* My appointments: the same, only for someone without the management space */}
              <Route path={Approutes.MyTasks} element={isPlayer ? <Navigate to={personalStart} replace /> : <MyAppointments />} />
              <Route path={Approutes.More} element={isMobile ? <MobileMore controller={controller} /> : <Navigate to={personalStart} replace />} />
              {/* The management pages are not part of the personal space */}
              <Route path="*" element={<Navigate to={personalStart} replace />} />
            </Routes>
          ) : (
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path={Approutes.Finance} element={<Home />} />
            <Route path={Approutes.Tasks} element={<AppointmentsRoute />} />
            <Route path="/appointments" element={<Navigate to={Approutes.Tasks} replace />} />
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
            <Route path={Approutes.Disciplinary} element={<RequirePermission module="disciplinary"><Disciplinary /></RequirePermission>} />
            {/* «إجراءاتي», for everyone: the personal space's page as it is */}
            <Route path={Approutes.MyDisciplinary} element={<MyDisciplinary />} />
            <Route path={Approutes.TrainingSessions} element={<TrainingSessionsRoute />} />
            <Route path={Approutes.TakeAttendance} element={<RequirePermission module="trainingSessions" action="attendance"><TakeAttendance /></RequirePermission>} />
            <Route path={Approutes.AbsenceRequests} element={<RequirePermission module="absences"><AbsenceRequests /></RequirePermission>} />
            {/* «غياباتي», for everyone: the personal space's page as it is (my requests and justifications) */}
            <Route path={Approutes.MyAbsences} element={<MyAbsences />} />
            <Route path={Approutes.Matches} element={<MatchesRoute />} />
            <Route path="/matches/:id/attendance" element={<RequirePermission module="matches" action="attendance"><MatchAttendance /></RequirePermission>} />
            <Route path={Approutes.MedicalRecords} element={<RequirePermission module="medical"><Medical /></RequirePermission>} />
            {/* «تقاريري الطبية», for everyone: the personal space's page as it is */}
            <Route path={Approutes.MyMedical} element={<MyMedical />} />
            <Route path={Approutes.Meetings} element={<MeetingsRoute />} />
            <Route path="/meetings/:id/attendance" element={<RequirePermission module="meetings" action="attendance"><TakeMeetingAttendance /></RequirePermission>} />
            <Route path={Approutes.Decisions} element={<RequirePermission module="decisions"><Decisions /></RequirePermission>} />
            <Route path={Approutes.Travels} element={<TravelsRoute />} />
            <Route path={Approutes.Feedback} element={<FeedbackRoute />} />
            <Route path={Approutes.Goals} element={<RequirePermission module="goals"><Goals /></RequirePermission>} />
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
      <DocViewerHost />
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


