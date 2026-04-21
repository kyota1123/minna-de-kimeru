import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VoteProcess } from './vote-process';

export default async function VotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('share_token', token)
    .single();

  if (!session || session.status !== 'active') redirect(`/join/${token}`);

  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('session_id', session.id)
    .order('display_order');

  return <VoteProcess session={session} artworks={artworks || []} token={token} />;
}
