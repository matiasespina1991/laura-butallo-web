import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Edit Exhibition'
};

export default function Page({
  params
}: {
  params: { exhibitionId: string };
}) {
  return (
    <PageContainer
      pageTitle='Edit Exhibition'
      pageDescription='Update exhibition details and media.'
    >
      <div className='text-muted-foreground'>
        Editing exhibition {params.exhibitionId}.
      </div>
    </PageContainer>
  );
}
