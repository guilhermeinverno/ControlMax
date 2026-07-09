import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Screen } from '../types';

export interface NavState {
  screen: Screen;
  params?: Record<string, unknown>;
}

interface NavigationContextType {
  navState: NavState;
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const SCREEN_ROUTES: Record<Screen, string> = {
  dashboard: '/dashboard',
  statistics: '/statistics',
  forms: '/forms',
  sales: '/sales',
  summary: '/summary',
  holidays: '/holidays',
  'edit-route': '/edit-route',
  'route-list': '/route-list',
  'user-list': '/user-list',
  'device-list': '/device-list',
  'edit-device': '/edit-device',
  'company-list': '/company-list',
  'sale-detail': '/sale-detail',
  'register-payment': '/register-payment',
  'payment-history': '/payment-history',
  'open-box': '/open-box',
  'close-box': '/close-box',
  'new-income': '/new-income',
  'new-expense': '/new-expense',
  performance: '/performance',
  'box-summary': '/box-summary',
  'transfer-sales': '/transfer-sales',
  'mass-box-opening': '/mass-box-opening',
  'auto-keys': '/auto-keys',
  'credit-requests': '/credit-requests',
  'business-centers': '/business-centers',
  'collection-cleaning': '/collection-cleaning',
  'period-summary': '/period-summary',
  superadmin: '/superadmin',
  'bc-incomes': '/bc-incomes',
  'bc-expenses': '/bc-expenses',
  'bc-transfers': '/bc-transfers',
  'bc-approvals': '/bc-approvals',
  'bc-map': '/bc-map',
  insurance: '/insurance',
  finance: '/finance',
  'platform-management': '/platform-management',
  'ai-assistant': '/ai-assistant',
  'collector-map': '/collector-map'
};

export const ROUTE_SCREENS: Record<string, Screen> = Object.entries(SCREEN_ROUTES).reduce(
  (acc, [screen, route]) => {
    acc[route] = screen as Screen;
    return acc;
  },
  {} as Record<string, Screen>
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigateReactRouter = useNavigate();
  const location = useLocation();

  // Derive the active screen name from the current pathname
  const path = location.pathname;
  let screen: Screen = 'dashboard';
  
  if (path === '/' || path === '') {
    screen = 'dashboard';
  } else {
    // Exact match or prefix match (to handle leading/trailing slashes or match nesting)
    const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    screen = ROUTE_SCREENS[normalizedPath] || 'dashboard';
  }

  // Combine params from router state and query string
  const searchParams = new URLSearchParams(location.search);
  const queryParams: Record<string, unknown> = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const params = {
    ...(location.state as Record<string, unknown> || {}),
    ...queryParams,
  };

  const navState: NavState = {
    screen,
    params,
  };

  const navigate = (targetScreen: Screen, targetParams?: Record<string, unknown>) => {
    let routePath = SCREEN_ROUTES[targetScreen] || '/dashboard';
    
    // If we have target parameters, serialize them into the URL query string
    // to support deep linking and refreshing, while also passing them via router state.
    if (targetParams) {
      const queryParts: string[] = [];
      Object.entries(targetParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
      });
      if (queryParts.length > 0) {
        routePath = `${routePath}?${queryParts.join('&')}`;
      }
    }

    navigateReactRouter(routePath, { state: targetParams });
  };

  return (
    <NavigationContext.Provider value={{ navState, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
