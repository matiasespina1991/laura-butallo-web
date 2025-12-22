'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ExhibitionRow } from '@/features/exhibitions/types';
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';

function PosterCell({ title, posterPath }: { title: string; posterPath?: string }) {
  const { src, hasSource, handleError } = useStorageAssetSrc(
    posterPath ? { storagePath: posterPath } : null,
    { preferDirect: false }
  );

  return (
    <div className='bg-muted flex h-20 w-20 items-center justify-center overflow-hidden rounded-md'>
      {hasSource ? (
        <img
          src={src}
          alt={`${title} poster`}
          className='h-full w-full object-cover'
          loading='lazy'
          onError={handleError}
        />
      ) : (
        <span className='text-muted-foreground text-xs'>No poster</span>
      )}
    </div>
  );
}

export const columns: ColumnDef<ExhibitionRow>[] = [
  {
    accessorKey: 'posterPath',
    header: '',
    cell: ({ row }) => {
      return (
        <PosterCell
          title={row.original.title}
          posterPath={row.original.posterPath}
        />
      );
    }
  },
  {
    id: 'search',
    accessorFn: (row) =>
      `${row.title} ${row.dateAndLocation ?? ''} ${row.body}`,
    header: 'SEARCH',
    enableSorting: false,
    enableHiding: true,
    enableColumnFilter: true,
    meta: {
      label: 'Search',
      placeholder: 'Search exhibitions...',
      variant: 'text',
      icon: Text
    }
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<ExhibitionRow, unknown> }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ cell }) => (
      <div className='min-w-[220px] font-medium'>
        {cell.getValue<ExhibitionRow['title']>()}
      </div>
    )
  },
  {
    accessorKey: 'dateAndLocation',
    header: 'Date and location',
    cell: ({ cell }) => (
      <div className='text-muted-foreground min-w-[200px] text-sm'>
        {cell.getValue<ExhibitionRow['dateAndLocation']>()}
      </div>
    )
  },
  {
    accessorKey: 'body',
    header: 'Body',
    cell: ({ cell }) => (
      <div className='text-foreground max-w-[25rem] truncate text-sm'>
        {cell.getValue<ExhibitionRow['body']>()}
      </div>
    )
  },
  {
    accessorKey: 'videoCount',
    header: 'Videos',
    cell: ({ cell }) => (
      <Badge variant='outline' className='tabular-nums'>
        {cell.getValue<ExhibitionRow['videoCount']>()}
      </Badge>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
