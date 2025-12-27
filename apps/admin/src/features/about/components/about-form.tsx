'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { toast } from 'sonner';

import { FormInput } from '@/components/forms/form-input';
import { FormQuill } from '@/components/forms/form-quill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { db } from '@/lib/firebase';

type AboutMeFormValues = {
  title: string;
  content: string;
  educationTitle: string;
  educationContent: string;
};

export default function AboutForm() {
  const form = useForm<AboutMeFormValues>({
    defaultValues: {
      title: '',
      content: '',
      educationTitle: '',
      educationContent: ''
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAbout = async () => {
      setLoading(true);
      try {
        const aboutQuery = query(
          collection(db, 'about_me_contact'),
          where('active', '==', true),
          limit(1)
        );
        const snapshot = await getDocs(aboutQuery);
        const firstDoc = snapshot.docs[0];
        if (!firstDoc) {
          toast.error('No se encontró información de About Me.');
          if (isMounted) setDocId(null);
          return;
        }

        const data = firstDoc.data() as {
          about_me?: {
            title?: string;
            content?: string;
            subcontent?: { education?: { title?: string; content?: string } };
          };
        };

        const about = data.about_me;
        if (isMounted) {
          setDocId(firstDoc.id);
          form.reset({
            title: about?.title ?? '',
            content: about?.content ?? '',
            educationTitle: about?.subcontent?.education?.title ?? '',
            educationContent: about?.subcontent?.education?.content ?? ''
          });
        }
      } catch (error) {
        console.error('[About] load error', error);
        toast.error('No se pudo cargar About Me.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAbout();

    return () => {
      isMounted = false;
    };
  }, [form]);

  const onSubmit = async (values: AboutMeFormValues) => {
    if (!docId) {
      toast.error('No se encontró el documento activo.');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'about_me_contact', docId), {
        about_me: {
          title: values.title,
          content: values.content,
          subcontent: {
            education: {
              title: values.educationTitle,
              content: values.educationContent
            }
          }
        }
      });
      form.reset(values);
      toast.success('About Me actualizado.');
    } catch (error) {
      console.error('[About] update error', error);
      toast.error('No se pudo guardar About Me.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          About Me
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          {loading ? (
            <div className='text-muted-foreground text-sm'>
              Cargando About Me...
            </div>
          ) : null}

          <div className='space-y-6'>
            <FormInput
              control={form.control}
              name='title'
              label='Título'
              placeholder='Ingresá el título'
              required
            />

            <FormQuill
              control={form.control}
              name='content'
              label='Contenido'
              placeholder='Escribí el texto principal...'
            />
          </div>

          <div className='space-y-6'>
            <FormInput
              control={form.control}
              name='educationTitle'
              label='Título de Educación'
              placeholder='Ingresá el título de educación'
            />
            <FormQuill
              control={form.control}
              name='educationContent'
              label='Contenido de Educación'
              placeholder='Escribí el contenido de educación...'
            />
          </div>

          <Button type='submit' disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Guardar About Me'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
