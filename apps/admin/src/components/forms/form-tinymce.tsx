'use client';

import { Editor } from '@tinymce/tinymce-react';
import { FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { BaseFormFieldProps } from '@/types/base-form';

interface FormTinyMceProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFormFieldProps<TFieldValues, TName> {
  placeholder?: string;
  height?: number;
}

function FormTinyMce<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  required,
  placeholder,
  height = 360,
  disabled,
  className
}: FormTinyMceProps<TFieldValues, TName>) {
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? '';

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className='ml-1 text-red-500'>*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Editor
              apiKey={apiKey}
              value={field.value}
              onEditorChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              init={{
                height,
                menubar: false,
                placeholder,
                plugins:
                  'lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
                toolbar:
                  'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | removeformat | help'
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export { FormTinyMce };
