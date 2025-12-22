'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormTinyMce } from '@/components/forms/form-tinymce';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type ExhibitionFormValues = {
  title: string;
  dateAndLocation: string;
  body: string;
};

type ExhibitionFormProps = {
  exhibitionId?: string;
};

export default function ExhibitionForm({ exhibitionId }: ExhibitionFormProps) {
  const form = useForm<ExhibitionFormValues>({
    defaultValues: {
      title: '',
      dateAndLocation: '',
      body: ''
    }
  });
  const router = useRouter();
  const [loading, setLoading] = useState(Boolean(exhibitionId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!exhibitionId) return;

    let isMounted = true;
    const loadExhibition = async () => {
      try {
        const snap = await getDoc(doc(db, 'exhibitions', exhibitionId));
        const data = snap.data() as {
          title?: string;
          dateAndLocation?: string;
          body?: string;
          mediaIds?: string[];
        };
        if (!isMounted) return;
        form.reset({
          title: data?.title ?? '',
          dateAndLocation: data?.dateAndLocation ?? '',
          body: data?.body ?? ''
        });
      } catch (error) {
        console.error('[Exhibitions] load exhibition error', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExhibition();

    return () => {
      isMounted = false;
    };
  }, [exhibitionId, form]);

  const onSubmit = async (values: ExhibitionFormValues) => {
    setSaving(true);
    try {
      if (exhibitionId) {
        await updateDoc(doc(db, 'exhibitions', exhibitionId), {
          title: values.title,
          dateAndLocation: values.dateAndLocation,
          body: values.body,
          updatedAt: serverTimestamp()
        });
        toast.success('Exhibition updated.');
      } else {
        await addDoc(collection(db, 'exhibitions'), {
          title: values.title,
          dateAndLocation: values.dateAndLocation,
          body: values.body,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Exhibition created.');
      }
      router.push('/dashboard/exhibitions');
    } catch (error) {
      console.error('[Exhibitions] update exhibition error', error);
      toast.error('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Add Exhibition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          {loading && (
            <div className='text-muted-foreground text-sm'>
              Loading exhibition...
            </div>
          )}
          <div className='grid grid-cols-1 gap-6'>
            <FormInput
              control={form.control}
              name='title'
              label='Title'
              placeholder='Enter exhibition title'
              required
            />

            <FormInput
              control={form.control}
              name='dateAndLocation'
              label='Date and location'
              placeholder='April 2025 · Wintercircus Arena, Belgium'
            />
          </div>

          <FormTinyMce
            control={form.control}
            name='body'
            label='Body'
            placeholder='Write the exhibition body...'
          />

          <Button type='submit' disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Exhibition'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
