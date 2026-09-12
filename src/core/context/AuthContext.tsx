import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserModel } from '../../View/Screen/UserManagement/Users/user_model';
import {type AppPermissions, RoleModel, emptyPermissions } from '../../View/Screen/UserManagement/Roles/role_model';
import { Crud } from '../class/Crud';
import { Applink } from '../../LinkApi';

interface AuthState {
  isAuthenticated: boolean;
  user: UserModel | null;
  permissions: AppPermissions;
  isFullAccess: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: any, roleData?: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const roleJson = localStorage.getItem('role');

    let user = null;
    let permissions = emptyPermissions;
    let isFullAccess = false;

    if (token) {
      if (userJson) {
        try {
          user = UserModel.fromJson(JSON.parse(userJson));
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
        }
      }
      
      // Attempt to load permissions from a saved role, or use defaults for now if not available
      if (roleJson) {
        try {
          const role = RoleModel.fromJson(JSON.parse(roleJson));
          permissions = role.permissions;
          isFullAccess = role.accessLevel === 'full';
        } catch (e) {
          console.error("Error parsing role from localStorage", e);
        }
      } else if (userJson) {
         // Fallback if role wasn't saved explicitly but might be inside user
         try {
           const parsedUser = JSON.parse(userJson);
           if (parsedUser.role) {
             const role = RoleModel.fromJson(parsedUser.role);
             permissions = role.permissions;
             isFullAccess = role.accessLevel === 'full';
           }
         } catch (e) {
           console.error("Error extracting role from user json", e);
         }
      }
    }

    return {
      isAuthenticated: !!token,
      user,
      permissions,
      isFullAccess
    };
  });

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    let isMounted = true;
    const fetchFreshAuth = async () => {
      try {
        const crud = new Crud();
        const response = await crud.getData(Applink.getUser);
        
        if (isMounted && response._tag === 'Right') {
          const resBody = response.right;
          if (resBody && resBody.status === 'success' && resBody.data) {
            const { user, role } = resBody.data;
            
            let parsedUser = null;
            let permissions = emptyPermissions;
            let isFullAccess = false;
            
            if (user) {
              try { parsedUser = UserModel.fromJson(user); } catch (e) {}
            }
            if (role) {
              try {
                const parsedRole = RoleModel.fromJson(role);
                permissions = parsedRole.permissions;
                isFullAccess = parsedRole.accessLevel === 'full';
              } catch (e) {}
            } else if (user && user.role) {
              try {
                const parsedRole = RoleModel.fromJson(user.role);
                permissions = parsedRole.permissions;
                isFullAccess = parsedRole.accessLevel === 'full';
              } catch (e) {}
            }
            
            setAuthState(prev => {
              const prevUserStr = JSON.stringify(prev.user);
              const newUserStr = JSON.stringify(parsedUser);
              const prevPermStr = JSON.stringify(prev.permissions);
              const newPermStr = JSON.stringify(permissions);
              
              if (prevUserStr !== newUserStr || prevPermStr !== newPermStr || prev.isFullAccess !== isFullAccess) {
                if (user) localStorage.setItem('user', JSON.stringify(user));
                if (role) localStorage.setItem('role', JSON.stringify(role));
                
                return {
                  ...prev,
                  user: parsedUser,
                  permissions,
                  isFullAccess
                };
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Failed to refresh auth data", error);
      }
    };

    fetchFreshAuth();
    const interval = setInterval(fetchFreshAuth, 15000); // Poll every 15 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [authState.isAuthenticated]);

  const login = (token: string, userData: any, roleData?: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (roleData) {
      localStorage.setItem('role', JSON.stringify(roleData));
    }

    let parsedUser = null;
    let permissions = emptyPermissions;
    let isFullAccess = false;

    try {
      parsedUser = UserModel.fromJson(userData);
    } catch (e) {
      console.error("Error parsing user data during login", e);
    }

    try {
      if (roleData) {
        const role = RoleModel.fromJson(roleData);
        permissions = role.permissions;
        isFullAccess = role.accessLevel === 'full';
      } else if (userData && userData.role) {
        const role = RoleModel.fromJson(userData.role);
        permissions = role.permissions;
        isFullAccess = role.accessLevel === 'full';
      }
    } catch (e) {
      console.error("Error parsing role data during login", e);
    }

    setAuthState({
      isAuthenticated: true,
      user: parsedUser,
      permissions,
      isFullAccess
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setAuthState({
      isAuthenticated: false,
      user: null,
      permissions: emptyPermissions,
      isFullAccess: false
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
