'use client';

import { useState } from 'react';
import HomeOrganizer from '@/features/home-organizer/components/home-organizer';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Plus, Database } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function HomePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);

  async function handleMigrateMediaSetIds() {
    if (!confirm('¿Migrar mediaSetId a mediaSetIds? Esta acción actualizará todos los media.')) {
      return;
    }

    try {
      setMigrating(true);
      const mediaSnapshot = await getDocs(collection(db, 'media'));
      const updates: Promise<void>[] = [];

      mediaSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const mediaSetId = data.mediaSetId;
        
        // Create mediaSetIds array based on mediaSetId
        const mediaSetIds = mediaSetId ? [mediaSetId] : [];
        
        updates.push(
          updateDoc(doc(db, 'media', docSnap.id), {
            mediaSetIds
          })
        );
      });

      await Promise.all(updates);
      toast.success(`Migración completada: ${updates.length} media actualizados`);
    } catch (error) {
      console.error('Error en migración:', error);
      toast.error('Error al migrar media');
    } finally {
      setMigrating(false);
    }
  }

  return (
    <PageContainer
      scrollable={true}
      className='w-full max-w-[55rem] justify-self-start'
      pageTitle='Home Organizer'
      pageDescription='Organiza los mediasets y sus ítems para la página de inicio'
      pageHeaderAction={
        <div className='flex gap-2'>
          <Button 
            variant='outline' 
            onClick={handleMigrateMediaSetIds}
            disabled={migrating}
          >
            <Database className='mr-2 h-4 w-4' />
            {migrating ? 'Migrando...' : 'Migrar a mediaSetIds'}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Agregar Nuevo Mediaset
          </Button>
        </div>
      }
    >
      <HomeOrganizer dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />
    </PageContainer>
  );
}
