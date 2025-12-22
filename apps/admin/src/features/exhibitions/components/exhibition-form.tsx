'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormTinyMce } from '@/components/forms/form-tinymce';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

type ExhibitionFormValues = {
  title: string;
  dateAndLocation: string;
  body: string;
  mediaIds: string;
};

export default function ExhibitionForm() {
  const form = useForm<ExhibitionFormValues>({
    defaultValues: {
      title: '',
      dateAndLocation: '',
      body: '',
      mediaIds: ''
    }
  });

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
          onSubmit={form.handleSubmit(() => {})}
          className='space-y-8'
        >
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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

          <FormTextarea
            control={form.control}
            name='mediaIds'
            label='Video media IDs'
            placeholder='Comma-separated media IDs'
            config={{ rows: 3 }}
          />

          <Button type='submit'>Save Exhibition</Button>
        </Form>
      </CardContent>
    </Card>
  );
}
