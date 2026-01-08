import PageContainer from '@/components/layout/page-container';
import { ThemeSelector } from '@/components/theme-selector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Dashboard: Configuración'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={true}
      pageTitle='Configuración'
      pageDescription='Ajusta el tema del panel.'
    >
      <Card className='mx-auto w-full max-w-[40rem]'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
