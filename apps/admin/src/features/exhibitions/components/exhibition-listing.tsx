'use client';

import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ExhibitionTable } from './exhibition-tables';
import { columns } from './exhibition-tables/columns';
import type { ExhibitionDoc, ExhibitionRow } from '@/features/exhibitions/types';

type ExhibitionListingPage = {};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function ExhibitionListingPage({}: ExhibitionListingPage) {
  const [data, setData] = useState<ExhibitionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadExhibitions = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'exhibitions'));
        const rows = snapshot.docs.map((doc) => {
          const values = doc.data() as ExhibitionDoc;
          const body = values.body ?? '';
          return {
            id: doc.id,
            title: values.title ?? '',
            dateAndLocation: values.dateAndLocation ?? '',
            body: stripHtml(body),
            videoCount: values.mediaIds?.length ?? 0
          };
        });

        if (isMounted) {
          setData(rows);
        }
      } catch (error) {
        console.error('[Exhibitions] load error', error);
        if (isMounted) {
          setData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExhibitions();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <DataTableSkeleton columnCount={4} rowCount={6} filterCount={1} />;
  }

  return (
    <ExhibitionTable
      data={data}
      totalItems={data.length}
      columns={columns}
    />
  );
}
