'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Exhibition } from '@/constants/exhibitions';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Exhibition>[] = [
  {
    id: 'search',
    accessorFn: (row) => `${row.title} ${row.meta} ${row.summary}`,
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
    header: ({ column }: { column: Column<Exhibition, unknown> }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ cell }) => (
      <div className='min-w-[220px] font-medium'>
        {cell.getValue<Exhibition['title']>()}
      </div>
    )
  },
  {
    accessorKey: 'meta',
    header: 'META',
    cell: ({ cell }) => (
      <div className='text-muted-foreground min-w-[200px] text-sm'>
        {cell.getValue<Exhibition['meta']>()}
      </div>
    )
  },
  {
    accessorKey: 'summary',
    header: 'SUMMARY',
    cell: ({ cell }) => (
      <div className='text-muted-foreground line-clamp-2 min-w-[260px] text-sm'>
        {cell.getValue<Exhibition['summary']>()}
      </div>
    )
  },
  {
    accessorKey: 'videoCount',
    header: 'VIDEOS',
    cell: ({ cell }) => (
      <Badge variant='outline' className='tabular-nums'>
        {cell.getValue<Exhibition['videoCount']>()}
      </Badge>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
