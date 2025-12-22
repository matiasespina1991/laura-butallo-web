import PageContainer from '@/components/layout/page-container';
import ExhibitionForm from '@/features/exhibitions/components/exhibition-form';

export const metadata = {
  title: 'Dashboard: Edit Exhibition'
};

export default async function Page({
  params
}: {
  params: Promise<{ exhibitionId: string }>;
}) {
  const { exhibitionId } = await params;

  return (
    <PageContainer
      pageTitle='Edit Exhibition'
      pageDescription='Update exhibition details and media.'
    >
      <ExhibitionForm exhibitionId={exhibitionId} />
    </PageContainer>
  );
}
