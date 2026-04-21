import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewSessionForm } from './new-session-form';

export default async function NewSessionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <NewSessionForm />;
}
