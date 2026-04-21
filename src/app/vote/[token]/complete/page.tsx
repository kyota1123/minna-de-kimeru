import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CompletionForm } from './completion-form';

export default async function CompletePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('share_token', token)
    .single();

  if (!session) redirect('/');

  return <CompletionForm session={session} token={token} />;
}
