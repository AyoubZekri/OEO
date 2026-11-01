import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Banknote, Wallet, FileText, Scale, Package, Calendar, FileWarning, Stethoscope, Briefcase, Bus, Landmark, Trophy, CalendarX2, MessageSquare, ClipboardList, PieChart, CalendarClock, Target } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import { useAuth } from '../../../core/context/AuthContext';
import { useSpace } from '../../../core/context/space';
import { useIsMobile } from '../../../core/functions/useIsMobile';

export interface SubMenuItem {
  name: string;
  label: string;
  route: string;
}

export interface MenuItem {
  name: string;
  icon: any; // Using any for icon as LucideIcon might require more specific imports
  isDropdown: boolean;
  label: string;
  route?: string;
  subItems?: SubMenuItem[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const useSaidparController = (onLogout?: () => void) => {
  const [isOpen, setIsOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState === 'closed' ? false : true;
  });
  const [activeItem, setActiveItem] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    localStorage.setItem('sidebarState', isOpen ? 'open' : 'closed');
  }, [isOpen]);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme === 'dark';
  });

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [dropdownName]: !prev[dropdownName],
    }));
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Load initial theme from local storage or system preference if desired
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('appTheme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('appTheme', 'light');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (itemName: string, route?: string) => {
    setActiveItem(itemName);
    if (isMobileOpen) {
      setIsMobileOpen(false); // Close mobile sidebar on item select
    }
    if (!isOpen) {
      setOpenDropdowns({}); // Close floating menus after selection
    }
    if (route) {
      navigate(route);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const { permissions, isFullAccess } = useAuth();
  // One space per account (the personal one only for who has no role in the management one)
  const { space, canManage, isPlayer } = useSpace();

  const hasAccess = (check: boolean) => isFullAccess || check;

  // The personal space's pages (added step by step)
  const personalSections: MenuSection[] = [
    {
      title: '',
      items: [
        // Only for who has no role in the management space (whose own records are there). A player: no home page nor
        // appointments; someone who is not a player: no medical reports
        ...(isPlayer ? [] : [
          { name: 'MyHome', icon: Home, isDropdown: false, label: 'sidebar.home', route: '/' },
          { name: 'MyTasks', icon: CalendarClock, isDropdown: false, label: 'مواعيد', route: Approutes.MyTasks },
        ]),
        { name: 'MyTrainingSessions', icon: Calendar, isDropdown: false, label: 'حصص التدريب', route: Approutes.MyTrainingSessions },
        { name: 'MyMatches', icon: Trophy, isDropdown: false, label: 'مباريات', route: Approutes.MyMatches },
        { name: 'MyAbsences', icon: CalendarX2, isDropdown: false, label: 'غيابات', route: Approutes.MyAbsences },
        { name: 'MyMeetings', icon: Briefcase, isDropdown: false, label: 'اجتماعات', route: Approutes.MyMeetings },
        { name: 'MyTravels', icon: Bus, isDropdown: false, label: 'تنقلات', route: Approutes.MyTravels },
        ...(isPlayer ? [{ name: 'MyMedical', icon: Stethoscope, isDropdown: false, label: 'تقارير طبية', route: Approutes.MyMedical }] : []),
        { name: 'MyDisciplinary', icon: Scale, isDropdown: false, label: 'إجراءات تأديبية', route: Approutes.MyDisciplinary },
        { name: 'MyFeedback', icon: MessageSquare, isDropdown: false, label: 'آراء واقتراحات', route: Approutes.MyFeedback },
      ],
    },
  ];

  const managementSections: MenuSection[] = [
    {
     title: "",
      items: [
        // Home, for everyone: the tasks whose time came (all of them with the tasks permission, mine only without);
        // the appointments page; the general goals; the finance (the former home page)
        { name: 'Home', icon: Home, isDropdown: false, label: 'sidebar.home', route: '/' },
        // The appointments, for everyone too: all of them with the appointments permission, mine only without
        { name: 'Tasks', icon: CalendarClock, isDropdown: false, label: 'المواعيد', route: Approutes.Tasks },
        // The general goals, after the appointments and before the finance
        ...(hasAccess(permissions.goals?.view ?? false) ? [{
          name: 'Goals',
          icon: Target,
          isDropdown: false,
          label: 'الأهداف العامة',
          route: Approutes.Goals,
        }] : []),
        ...(hasAccess(permissions.dashboard?.view ?? true) ? [{
          name: 'Finance',
          icon: PieChart,
          isDropdown: false,
          label: 'المالية',
          route: Approutes.Finance,
        }] : []),
        ...(hasAccess(permissions.members.view) ? [{
          name: 'Members',
          icon: Users,
          isDropdown: false,
          label: 'sidebar.members',
          route: Approutes.Members,
        }] : []),

        // The teams: on a computer, from the members page's button; the phone's «المزيد» keeps them
        ...(isMobile && hasAccess(permissions.teams.view) ? [{
          name: 'Teams',
          icon: Users,
          isDropdown: false,
          label: 'فئات الفرق',
          route: Approutes.Teams,
        }] : []),
        // The meetings, for everyone too (all of them with their permission, mine only without); the decisions, by theirs
        {
          name: 'MeetingsGroup',
          icon: Briefcase,
          isDropdown: true,
          label: 'إدارة الاجتماعات',
          subItems: [
            {
              name: 'Meetings',
              label: 'الاجتماعات',
              route: Approutes.Meetings,
            },
            ...(hasAccess(permissions.decisions.view) ? [{
              name: 'Decisions',
              label: 'القرارات',
              route: Approutes.Decisions,
            }] : []),
          ]
        },
        // The training sessions, for everyone too: all of them with their permission, mine only without
        { name: 'TrainingSessions', icon: Calendar, isDropdown: false, label: 'حصص التدريب', route: Approutes.TrainingSessions },
        // The trips, for everyone too: all of them with their permission, mine only without
        { name: 'Travels', icon: Bus, isDropdown: false, label: 'التنقلات', route: Approutes.Travels },
        // The matches, for everyone too: all of them with their permission, mine only without
        { name: 'Matches', icon: Calendar, isDropdown: false, label: 'المباريات', route: Approutes.Matches },
        // The absences, like the equipment: the absences page (with its permission: the others', the decisions), and
        // «غياباتي» for everyone (the personal space's page, as it is)
        {
          name: 'AbsencesGroup',
          icon: FileWarning,
          isDropdown: true,
          label: 'الغيابات',
          subItems: [
            ...(hasAccess(permissions.absences.view) ? [{ name: 'AbsenceRequests', label: 'الغيابات', route: Approutes.AbsenceRequests }] : []),
            { name: 'MyAbsencesPage', label: 'غياباتي', route: Approutes.MyAbsences },
          ],
        },
        // The disciplinary actions, like the equipment: the actions page (with its permission), and «إجراءاتي» for
        // everyone (the personal space's page, as it is)
        {
          name: 'DisciplinaryGroup',
          icon: Scale,
          isDropdown: true,
          label: 'الإجراءات التأديبية',
          subItems: [
            ...(hasAccess(permissions.disciplinary.view) ? [{ name: 'Disciplinary', label: 'الإجراءات التأديبية', route: Approutes.Disciplinary }] : []),
            { name: 'MyDisciplinaryPage', label: 'إجراءاتي', route: Approutes.MyDisciplinary },
          ],
        },
        // The medical reports, like the equipment: the medical page (with its permission), and «تقاريري الطبية» for
        // everyone (the personal space's page, as it is)
        {
          name: 'MedicalGroup',
          icon: Stethoscope,
          isDropdown: true,
          label: 'التقارير الطبية',
          subItems: [
            ...(hasAccess(permissions.medical.view) ? [{ name: 'MedicalRecords', label: 'التقرير الطبي', route: Approutes.MedicalRecords }] : []),
            { name: 'MyMedicalPage', label: 'تقاريري الطبية', route: Approutes.MyMedical },
          ],
        },
        ...((hasAccess(permissions.equipment.view) || hasAccess(permissions.equipmentOperations.view)) ? [{
          name: 'EquipmentGroup',
          icon: Package,
          isDropdown: true,
          label: 'العتاد',
          subItems: [
            ...(hasAccess(permissions.equipment.view) ? [{
              name: 'Equipment',
              label: 'معدات الفريق',
              route: Approutes.Equipment,
            }] : []),
            ...(hasAccess(permissions.equipmentOperations.view) ? [{
              name: 'EquipmentOperations',
              label: 'حركة العتاد',
              route: Approutes.EquipmentOperations,
            }] : [])
          ]
        }] : []),
        // The opinions, one page for everyone: everyone's with their permission (mine sent from it), mine only without
        { name: 'Feedback', icon: MessageSquare, isDropdown: false, label: 'آراء واقتراحات', route: Approutes.Feedback },
        ...(hasAccess(permissions.contracts.view) ? [{
          name: 'Contracts',
          icon: FileText,
          isDropdown: false,
          label: 'sidebar.contracts',
          route: Approutes.Contracts,
        }] : []),
        ...(hasAccess(permissions.payments.view) ? [{
          name: 'Payments',
          icon: Banknote,
          isDropdown: false,
          label: 'sidebar.payments',
          route: Approutes.Payments,
        }] : []),
        ...(hasAccess(permissions.funds.view) ? [{
          name: 'Funds',
          icon: Wallet,
          isDropdown: false,
          label: 'sidebar.funds',
          route: Approutes.Funds,
        }] : []),
        ...(hasAccess(permissions.debts?.view ?? false) ? [{
          name: 'Debts',
          icon: Landmark,
          isDropdown: false,
          label: 'الديون',
          route: Approutes.Debts,
        }] : []),
        ...(hasAccess(permissions.reports.view) ? [{
          name: 'Reports',
          icon: FileText,
          isDropdown: false,
          label: 'sidebar.reports',
          route: Approutes.Reports,
        }] : []),
        ...((hasAccess(permissions.usersAndRoles.viewRoles) || hasAccess(permissions.usersAndRoles.viewUsers)) ? [{
          name: 'UsersManagement',
          icon: Users,
          isDropdown: true,
          label: 'sidebar.users_management',
          subItems: [
            ...(hasAccess(permissions.usersAndRoles.viewRoles) ? [{
              name: 'Roles',
              label: 'sidebar.roles',
              route: Approutes.Roles,
            }] : []),
            ...(hasAccess(permissions.usersAndRoles.viewUsers) ? [{
              name: 'Users',
              label: 'sidebar.users',
              route: Approutes.Users,
            }] : [])
          ]
        }] : []),
      ]
    },
  ];

  const menuSections = space === 'personal' ? personalSections : managementSections;

  // The page shown decides the active item (title and highlight), also after a redirect or a refresh
  const { pathname } = useLocation();
  const routed = menuSections
    .flatMap(section => section.items)
    .flatMap(item => [item, ...(item.subItems || [])])
    .find(item => item.route === pathname);
  const currentItem = routed?.name ?? activeItem;

  // The home page, when this space's menu has it (its permission): the top bar's home button too
  const homeItem = menuSections.flatMap(section => section.items).find(item => item.route === '/');

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return {
    isOpen,
    activeItem: currentItem,
    searchQuery,
    setSearchQuery,
    isDarkMode,
    toggleTheme,
    toggleSidebar,
    handleItemClick,
    menuSections,
    homeItem,
    space,
    canManage,
    openDropdowns,
    toggleDropdown,
    isMobileOpen,
    toggleMobileSidebar,
    handleLogout,
  };
};




