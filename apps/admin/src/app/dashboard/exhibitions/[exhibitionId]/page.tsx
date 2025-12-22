import PageContainer from '@/components/layout/page-container';
import ExhibitionForm from '@/features/exhibitions/components/exhibition-form';

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
      <ExhibitionForm />
    </PageContainer>
  );
}
