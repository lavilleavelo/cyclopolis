import dayjs from 'dayjs';
import 'dayjs/locale/fr';

export function formatDoneAt(doneAt: string): string {
  const [, month, year] = doneAt.split('/');
  return dayjs(new Date(Number(year), Number(month) - 1))
    .locale('fr')
    .format('MMMM YYYY');
}
