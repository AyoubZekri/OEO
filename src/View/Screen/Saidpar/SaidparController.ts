import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, Banknote, Wallet, FileText, Scale, Package, Mail, Calendar, FileWarning } from 'lucide-react';
import { Approutes } from '../../../core/constant/routes';
import { useAuth } from '../../../core/context/AuthContext';

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
  
  const hasAccess = (check: boolean) => isFullAccess || check;

  const menuSections: MenuSection[] = [
    {
     title: "",
      items: [
        ...(hasAccess(permissions.dashboard?.view ?? true) ? [{
          name: 'Home',
          icon: Home,
          isDropdown: false,
          label: 'sidebar.home',
          route: '/',
        }] : []),
        ...(hasAccess(permissions.members.view) ? [{
          name: 'Members',
          icon: Users,
          isDropdown: false,
          label: 'sidebar.members',
          route: Approutes.Members,
        }] : []),
        ...(hasAccess(permissions.members.view) ? [{
          name: 'Correspondences',
          icon: Mail,
          isDropdown: false,
          label: 'المراسلات الرسمية',
          route: Approutes.Correspondences,
        }] : []),
        ...(hasAccess(permissions.members.view) ? [{
          name: 'Disciplinary',
          icon: Scale,
          isDropdown: false,
          label: 'الإجراءات التأديبية',
          route: Approutes.Disciplinary,
        }] : []),
        ...(hasAccess(permissions.teams.view) ? [{
          name: 'Teams',
          icon: Users,
          isDropdown: false,
          label: 'فئات الفرق',
          route: Approutes.Teams,
        }] : []),
        ...(hasAccess(true) ? [{
          name: 'TrainingSessions',
          icon: Calendar,
          isDropdown: false,
          label: 'حصص التدريب',
          route: Approutes.TrainingSessions,
        }] : []),
        ...(hasAccess(true) ? [{
          name: 'AbsenceRequests',
          icon: FileWarning,
          isDropdown: false,
          label: 'sidebar.absence_requests',
          route: Approutes.AbsenceRequests,
        }] : []),
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
        ...(hasAccess(permissions.reports.view) ? [{
          name: 'Reports',
          icon: FileText,
          isDropdown: false,
          label: 'sidebar.reports',
          route: Approutes.Reports,
        }] : []),
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

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return {
    isOpen,
    activeItem,
    searchQuery,
    setSearchQuery,
    isDarkMode,
    toggleTheme,
    toggleSidebar,
    handleItemClick,
    menuSections,
    openDropdowns,
    toggleDropdown,
    isMobileOpen,
    toggleMobileSidebar,
    handleLogout,
  };
};
