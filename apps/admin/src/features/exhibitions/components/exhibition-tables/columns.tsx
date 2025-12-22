'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ExhibitionRow } from '@/features/exhibitions/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';

export const columns: ColumnDef<ExhibitionRow>[] = [
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
