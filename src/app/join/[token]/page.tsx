import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JoinLanding } from './join-landing';

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('share_token', token)
    .single();

  if (!session) redirect('/');

  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('session_id', session.id)
    .order('display_order');

  return <JoinLanding session={session} artworks={artworks || []} token={token} />;
}
