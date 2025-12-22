import PageContainer from '@/components/layout/page-container';
import ExhibitionForm from '@/features/exhibitions/components/exhibition-form';

export const metadata = {
  title: 'Dashboard: New Exhibition'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Add Exhibition'
      pageDescription='Create a new exhibition entry.'
    >
      <ExhibitionForm />
    </PageContainer>
  );
}
