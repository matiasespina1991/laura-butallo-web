import PageContainer from '@/components/layout/page-container';
import ExhibitionForm from '@/features/exhibitions/components/exhibition-form';

export const metadata = {
  title: 'Dashboard: Editar exhibición'
};

export default async function Page({
  params
}: {
  params: Promise<{ exhibitionId: string }>;
}) {
  const { exhibitionId } = await params;

  return (
    <PageContainer
      pageTitle='Editar exhibición'
      pageDescription='Actualizá los detalles y los medios de la exhibición.'
    >
      <ExhibitionForm exhibitionId={exhibitionId} />
    </PageContainer>
  );
}
