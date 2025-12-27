import PageContainer from '@/components/layout/page-container';
import ContactForm from '@/features/contact/components/contact-form';

export const metadata = {
  title: 'Dashboard: Contacto'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={true}
      pageTitle='Contacto'
      pageDescription='Edita los links de contacto.'
    >
      <ContactForm />
    </PageContainer>
  );
}
