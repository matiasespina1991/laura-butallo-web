'use client';

import { useEffect, useRef, useState } from 'react';
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
  const lastSavedValuesRef = useRef<AboutMeFormValues | null>(null);
  const hasUnsavedChanges = Boolean(
    lastSavedValuesRef.current && form.formState.isDirty
  );

  const handleUndoChanges = () => {
    if (!lastSavedValuesRef.current) return;
    form.reset(lastSavedValuesRef.current);
  };

  useEffect(() => {
    let isMounted = true;
    const loadAbout = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'about_me', ABOUT_DOC_ID));
        const data = docSnap.exists()
          ? (docSnap.data() as AboutMeDoc | undefined)
          : undefined;
        const nextValues = {
          title: data?.title ?? '',
          content: data?.content ?? '',
          educationTitle: data?.subcontent?.education?.title ?? '',
          educationContent: data?.subcontent?.education?.content ?? ''
        };
        if (isMounted) {
          form.reset(nextValues);
          lastSavedValuesRef.current = nextValues;
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
      lastSavedValuesRef.current = values;
      toast.success('About Me actualizado.');
    } catch (error) {
      console.error('[About] update error', error);
      toast.error('No se pudo guardar About Me.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-[64rem]'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>About Me</CardTitle>
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

          {hasUnsavedChanges ? (
            <div className='mb-1 flex items-center text-sm'>
              <span className='text-red-500'>Hay cambios sin guardar.</span>
              <Button
                type='button'
                variant='link'
                className='text-foreground ml-1 h-auto p-0 text-sm underline underline-offset-2'
                onClick={handleUndoChanges}
              >
                Deshacer
              </Button>
              <span>.</span>
            </div>
          ) : null}

          <Button type='submit' disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
