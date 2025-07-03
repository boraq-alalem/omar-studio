
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/endpoints';

export default function HomePage() {
  redirect(ROUTES.LOGIN);
}
