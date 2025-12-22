'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
  type UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
  user: DemoUser | null;
  organizations: DemoOrganization[];
  activeOrgId: string;
  activeOrganization: DemoOrganization;
  selectOrganization: (id: string) => void;
  authReady: boolean;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const googleProvider = new GoogleAuthProvider();

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

function mapFirebaseUser(user: User): DemoUser {
  const email = user.email ?? '';
  return {
    id: user.uid,
    fullName: user.displayName ?? email ?? 'Admin',
    emailAddresses: [{ emailAddress: email }],
    imageUrl: user.photoURL ?? undefined,
    role: 'admin'
  };
}

export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeOrgId, setActiveOrgId] = useState(demoOrganizations[0].id);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(() => {
    const activeOrganization =
      demoOrganizations.find((org) => org.id === activeOrgId) ??
      demoOrganizations[0];

    return {
      user: firebaseUser ? mapFirebaseUser(firebaseUser) : null,
      organizations: demoOrganizations,
      activeOrgId,
      activeOrganization,
      selectOrganization: setActiveOrgId,
      authReady,
      signInWithGoogle: () => signInWithPopup(auth, googleProvider),
      signOut: () => firebaseSignOut(auth)
    };
  }, [activeOrgId, authReady, firebaseUser]);

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
