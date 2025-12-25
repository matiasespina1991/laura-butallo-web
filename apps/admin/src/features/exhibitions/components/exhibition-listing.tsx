'use client';

import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
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
        const rows = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const values = docSnap.data() as ExhibitionDoc;
            const body = values.body ?? '';
            const mediaId = values.featureMediaId ?? values.mediaIds?.[0];
            let posterPath: string | undefined;

            if (mediaId) {
              try {
                const mediaSnap = await getDoc(doc(db, 'media', mediaId));
                const mediaData = mediaSnap.data() as {
                  paths?: { poster?: { storagePath?: string } };
                };
                posterPath = mediaData?.paths?.poster?.storagePath;
              } catch (error) {
                console.warn('[Exhibitions] poster load error', mediaId, error);
              }
            }

            return {
              id: docSnap.id,
              title: values.title ?? '',
              dateAndLocation: values.dateAndLocation ?? '',
              body: stripHtml(body),
              posterPath,
              videoCount:
                (values.mediaIds?.length ?? 0) +
                (values.featureMediaId ? 1 : 0)
            };
          })
        );

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
