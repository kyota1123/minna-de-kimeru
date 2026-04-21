import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SessionManagement } from './session-management';

export default async function SessionPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: session } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('id', session_id)
    .single();

  if (!session) redirect('/dashboard');

  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('session_id', session_id)
    .order('display_order');

  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', session_id)
    .order('participant_number');

  return (
    <SessionManagement
      session={session}
      artworks={artworks || []}
      participants={participants || []}
    />
  );
}
