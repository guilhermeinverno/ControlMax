import { useState } from 'react';
import { useSuperAdminData } from '../hooks/useSuperAdminData';
import type { SuperAdminMenu } from '../types/superAdmin';
import { SuperAdminShell } from './components/superAdmin/SuperAdminShell';

export function SuperAdmin() {
  const [activeMenu, setActiveMenu] = useState<SuperAdminMenu>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const adminData = useSuperAdminData();

  return (
    <SuperAdminShell
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      {...adminData}
    />
  );
}
