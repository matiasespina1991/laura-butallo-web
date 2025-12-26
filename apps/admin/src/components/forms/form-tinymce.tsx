'use client';

import { Editor } from '@tinymce/tinymce-react';
import { FieldPath, FieldValues } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
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
  height = 401,
  disabled,
  className
}: FormTinyMceProps<TFieldValues, TName>) {
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? '';

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const computeIsDark = () => root.classList.contains('dark');

    // Inicial
    setIsDark(computeIsDark());

    // Escucha cambios en la clase del <html> (Tailwind dark mode por class, next-themes, etc.)
    const observer = new MutationObserver(() => {
      setIsDark(computeIsDark());
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // TinyMCE no siempre aplica cambios de skin/content_css en caliente.
  // Forzamos un remount al cambiar el tema.
  const editorKey = isDark ? 'tinymce-dark' : 'tinymce-light';

  const init = useMemo(
    () => ({
      height,
      menubar: false,
      placeholder,

      skin: isDark ? 'oxide-dark' : 'oxide',
      content_css: isDark ? 'dark' : 'default',

      plugins:
        'lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
      toolbar:
        'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | removeformat | help'
    }),
    [height, placeholder, isDark]
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className='text-red-500'>*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Editor
              plugins={[
                // Core editing features
                'anchor',
                'autolink',
                'charmap',
                'codesample',
                'emoticons',
                'link',
                'lists',
                'media',
                'searchreplace',
                'table',
                'visualblocks',
                'wordcount',
                // Your account includes a free trial of TinyMCE premium features
                // Try the most popular premium features until Jan 5, 2026:
                'checklist',
                'mediaembed',
                'casechange',
                'formatpainter',
                'pageembed',
                'a11ychecker',
                'tinymcespellchecker',
                'permanentpen',
                'powerpaste',
                'advtable',
                'advcode',
                'advtemplate',
                'ai',
                'uploadcare',
                'mentions',
                'tinycomments',
                'tableofcontents',
                'footnotes',
                'mergetags',
                'autocorrect',
                'typography',
                'inlinecss',
                'markdown',
                'importword',
                'exportword',
                'exportpdf'
              ]}
              key={editorKey}
              apiKey={apiKey}
              value={field.value ?? ''}
              onEditorChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              init={init}
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
