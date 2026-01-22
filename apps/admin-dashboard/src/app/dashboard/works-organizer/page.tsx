'use client';

import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryOrganizer from '@/features/works-organizer/components/category-organizer';

export default function WorksOrganizerPage() {
  return (
    <PageContainer
      scrollable={true}
      className='w-full max-w-[55rem] justify-self-start'
      pageTitle='Works Organizer'
      pageDescription='Organiza los mediasets de cada categoría (Home, Caves, Landscapes)'
    >
      <Tabs defaultValue='home' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='home' className='cursor-pointer'>
            Home
          </TabsTrigger>
          <TabsTrigger value='caves' className='cursor-pointer'>
            Caves
          </TabsTrigger>
          <TabsTrigger value='landscapes' className='cursor-pointer'>
            Landscapes
          </TabsTrigger>
        </TabsList>

        <TabsContent value='home' className='mt-6'>
          <CategoryOrganizer category='home' />
        </TabsContent>

        <TabsContent value='caves' className='mt-6'>
          <CategoryOrganizer category='caves' />
        </TabsContent>

        <TabsContent value='landscapes' className='mt-6'>
          <CategoryOrganizer category='landscapes' />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
