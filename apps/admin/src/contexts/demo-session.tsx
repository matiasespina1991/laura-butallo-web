'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type PlanTier = 'starter' | 'pro' | 'enterprise';

export interface DemoOrganization {
  id: string;
  name: string;
  description: string;
  plan: PlanTier;
  imageUrl?: string;
  members: number;
  storageUsedGb: number;
}

export interface DemoUser {
  id: string;
  fullName: string;
  emailAddresses: Array<{ emailAddress: string }>;
  imageUrl?: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface DemoSessionContextValue {
  user: DemoUser;
  organizations: DemoOrganization[];
  activeOrgId: string;
  activeOrganization: DemoOrganization;
  selectOrganization: (id: string) => void;
  signOut: () => void;
}

const defaultUser: DemoUser = {
  id: 'user_demo',
  fullName: 'Laura Butallo Studio',
  emailAddresses: [{ emailAddress: 'studio@laurabutallo.com' }],
  imageUrl: undefined,
  role: 'admin'
};

const demoOrganizations: DemoOrganization[] = [
  {
    id: 'org_creative_house',
    name: 'Creative House',
    description: 'Portfolio operations and editorial workflow',
    plan: 'pro',
    imageUrl: undefined,
    members: 12,
    storageUsedGb: 187
  },
  {
    id: 'org_lab',
    name: 'Lab Experiments',
    description: 'Experimental shoots and prototypes',
    plan: 'starter',
    imageUrl: undefined,
    members: 4,
    storageUsedGb: 52
  },
  {
    id: 'org_archive',
    name: 'Archive Atelier',
    description: 'Historical catalog and press outreach',
    plan: 'enterprise',
    imageUrl: undefined,
    members: 18,
    storageUsedGb: 402
  }
];

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null);

export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeOrgId, setActiveOrgId] = useState(demoOrganizations[0].id);

  const value = useMemo(() => {
    const activeOrganization =
      demoOrganizations.find((org) => org.id === activeOrgId) ??
      demoOrganizations[0];

    return {
      user: defaultUser,
      organizations: demoOrganizations,
      activeOrgId,
      activeOrganization,
      selectOrganization: setActiveOrgId,
      signOut: () => {
        console.info('TODO: replace with Firebase Auth sign-out.');
      }
    };
  }, [activeOrgId]);

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) {
    throw new Error('useDemoSession must be used within DemoSessionProvider');
  }
  return ctx;
}
