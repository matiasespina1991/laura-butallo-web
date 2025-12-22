import { exhibitions } from '@/constants/exhibitions';
import { ExhibitionTable } from './exhibition-tables';
import { columns } from './exhibition-tables/columns';

type ExhibitionListingPage = {};

export default async function ExhibitionListingPage({}: ExhibitionListingPage) {
  return (
    <ExhibitionTable
      data={exhibitions}
      totalItems={exhibitions.length}
      columns={columns}
    />
  );
}
