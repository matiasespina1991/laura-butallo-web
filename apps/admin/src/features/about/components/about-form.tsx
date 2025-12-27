'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

import { FormInput } from '@/components/forms/form-input';
import { FormQuill } from '@/components/forms/form-quill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { db } from '@/lib/firebase';

const ABOUT_DOC_ID = 'default';

type AboutMeFormValues = {
  title: string;
  content: string;
  educationTitle: string;
  educationContent: string;
};

type AboutMeDoc = {
  title?: string;
  content?: string;
  subcontent?: { education?: { title?: string; content?: string } };
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

  useEffect(() => {
    let isMounted = true;
    const loadAbout = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'about_me', ABOUT_DOC_ID));
        if (!docSnap.exists()) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        const data = docSnap.data() as AboutMeDoc | undefined;
        const about = data;
        if (isMounted) {
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
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'about_me', ABOUT_DOC_ID),
        {
          title: values.title,
          content: values.content,
          subcontent: {
            education: {
              title: values.educationTitle,
              content: values.educationContent
            }
          }
        },
        { merge: true }
      );
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
              height={280}
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
              height={280}
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
