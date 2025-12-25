'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { parseAsInteger, useQueryState } from 'nuqs';

interface ExhibitionTableParams<TData extends { id: string }, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function ExhibitionTable<TData extends { id: string }, TValue>({
  data,
  totalItems,
  columns
}: ExhibitionTableParams<TData, TValue>) {
  const router = useRouter();
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const pageCount = Math.ceil(totalItems / pageSize);

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500,
    initialState: {
      columnVisibility: {
        search: false
      }
    }
  });

  return (
    <DataTable
      table={table}
      onRowClick={(row) => router.push(`/dashboard/exhibitions/${row.original.id}`)}
    >
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
