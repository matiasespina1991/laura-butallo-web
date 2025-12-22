import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: New Exhibition'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Add Exhibition'
      pageDescription='Create a new exhibition entry.'
    >
      <div className='text-muted-foreground'>
        Exhibition creation form goes here.
      </div>
    </PageContainer>
  );
}
