'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { FormInput } from '@/components/forms/form-input';
import { FormQuill } from '@/components/forms/form-quill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import { IconTrash } from '@tabler/icons-react';

type AboutMeFormValues = {
  title: string;
  content: string;
  educationTitle: string;
  educationContent: string;
};

type ContactItem = {
  id: string;
  label: string;
  url: string;
  order: number;
};

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function normalizeContactItems(items: ContactItem[]) {
  return items
    .map((item, index) => ({ ...item, order: item.order ?? index }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function mapLegacyContact(contact?: Record<string, string>) {
  if (!contact) return [];
  const items: ContactItem[] = [];
  if (contact.contact_email) {
    items.push({
      id: createId(),
      label: 'Email',
      url: `mailto:${contact.contact_email}`,
      order: items.length
    });
  }
  if (contact.instagram_url) {
    items.push({
      id: createId(),
      label: 'Instagram',
      url: contact.instagram_url,
      order: items.length
    });
  }
  if (contact.linktree_url) {
    items.push({
      id: createId(),
      label: 'Linktree',
      url: contact.linktree_url,
      order: items.length
    });
  }
  if (contact.behance_url) {
    items.push({
      id: createId(),
      label: 'Behance',
      url: contact.behance_url,
      order: items.length
    });
  }
  if (contact.whatsapp_number) {
    const digits = contact.whatsapp_number.replace(/\D/g, '');
    items.push({
      id: createId(),
      label: 'WhatsApp',
      url: digits ? `https://wa.me/${digits}` : contact.whatsapp_number,
      order: items.length
    });
  }
  return items;
}

function SortableContactRow({
  item,
  onChange,
  onRemove
}: {
  item: ContactItem;
  onChange: (next: ContactItem) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      className={cn(
        'border-border/60 bg-card flex flex-col gap-3 rounded-lg border p-3 shadow-xs sm:flex-row sm:items-center',
        isDragging ? 'opacity-70' : null
      )}
    >
      <button
        type='button'
        ref={setActivatorNodeRef}
        className='text-muted-foreground hover:text-foreground inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors cursor-grab active:cursor-grabbing'
        aria-label='Reordenar contacto'
        {...attributes}
        {...listeners}
      >
        <GripVertical className='h-4 w-4' />
      </button>
      <div className='grid flex-1 gap-3 sm:grid-cols-2'>
        <Input
          value={item.label}
          placeholder='Etiqueta'
          onChange={(event) =>
            onChange({ ...item, label: event.target.value })
          }
        />
        <Input
          value={item.url}
          placeholder='URL'
          onChange={(event) =>
            onChange({ ...item, url: event.target.value })
          }
        />
      </div>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={onRemove}
      >
        <IconTrash className='h-4 w-4' />
      </Button>
    </div>
  );
}

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
  const [contactItems, setContactItems] = useState<ContactItem[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
          contact?: { items?: ContactItem[] } | Record<string, string>;
        };

        const about = data.about_me;
        const contact =
          (data.contact as { items?: ContactItem[] } | undefined)?.items ??
          mapLegacyContact(data.contact as Record<string, string>);
        const normalizedContact = normalizeContactItems(
          (contact ?? []).map((item, index) => ({
            id: item.id || createId(),
            label: item.label ?? '',
            url: item.url ?? '',
            order: item.order ?? index
          }))
        );
        if (isMounted) {
          setDocId(firstDoc.id);
          form.reset({
            title: about?.title ?? '',
            content: about?.content ?? '',
            educationTitle: about?.subcontent?.education?.title ?? '',
            educationContent: about?.subcontent?.education?.content ?? ''
          });
          setContactItems(normalizedContact);
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

  const contactIds = useMemo(
    () => contactItems.map((item) => item.id),
    [contactItems]
  );

  const handleContactDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = contactItems.findIndex((item) => item.id === active.id);
    const newIndex = contactItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(contactItems, oldIndex, newIndex).map(
      (item, index) => ({ ...item, order: index })
    );
    setContactItems(next);
  };

  const handleContactChange = (next: ContactItem) => {
    setContactItems((prev) =>
      prev.map((item) => (item.id === next.id ? next : item))
    );
  };

  const handleContactRemove = (id: string) => {
    setContactItems((prev) =>
      prev.filter((item) => item.id !== id).map((item, index) => ({
        ...item,
        order: index
      }))
    );
  };

  const handleContactAdd = () => {
    setContactItems((prev) => [
      ...prev,
      {
        id: createId(),
        label: '',
        url: '',
        order: prev.length
      }
    ]);
  };

  const onSubmit = async (values: AboutMeFormValues) => {
    if (!docId) {
      toast.error('No se encontró el documento activo.');
      return;
    }
    setSaving(true);
    try {
      const cleanedItems = contactItems
        .map((item) => ({
          id: item.id,
          label: item.label.trim(),
          url: item.url.trim()
        }))
        .filter((item) => item.label || item.url)
        .map((item, index) => ({
          ...item,
          order: index
        }));

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
        },
        contact: {
          items: cleanedItems
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

          <div className='space-y-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='text-sm font-semibold'>Contacto</div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 px-3 text-xs'
                onClick={handleContactAdd}
              >
                Agregar contacto
              </Button>
            </div>

            {contactItems.length ? (
              <DndContext sensors={sensors} onDragEnd={handleContactDragEnd}>
                <SortableContext
                  items={contactIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className='flex flex-col gap-3'>
                    {contactItems.map((item) => (
                      <SortableContactRow
                        key={item.id}
                        item={item}
                        onChange={handleContactChange}
                        onRemove={() => handleContactRemove(item.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className='text-muted-foreground text-sm'>
                No hay contactos todavía.
              </div>
            )}
          </div>

          <Button type='submit' disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Guardar About Me'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
