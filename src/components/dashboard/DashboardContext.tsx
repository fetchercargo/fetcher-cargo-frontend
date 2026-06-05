'use client';

import { createContext, useContext } from 'react';

export interface DashboardUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

const DashboardUserContext = createContext<DashboardUser | null>(null);

export function DashboardProvider({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  return (
    <DashboardUserContext.Provider value={user}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser(): DashboardUser {
  const user = useContext(DashboardUserContext);
  if (!user) {
    throw new Error('useDashboardUser must be used within a DashboardProvider');
  }
  return user;
}
