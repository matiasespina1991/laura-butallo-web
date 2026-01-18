'use client';

import { useState } from 'react';
import HomeOrganizer from '@/features/home-organizer/components/home-organizer';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function HomePage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <PageContainer
      scrollable={true}
      className='w-full max-w-[55rem] justify-self-start'
      pageTitle='Home Organizer'
      pageDescription='Organiza los mediasets y sus ítems para la página de inicio'
      pageHeaderAction={
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          New Mediaset
        </Button>
      }
    >
      <HomeOrganizer dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />
    </PageContainer>
  );
}
