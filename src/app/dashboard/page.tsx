import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardContent } from './dashboard-content';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('google_id', user.id)
    .single();

  const { data: sessions } = organizer
    ? await supabase
        .from('voting_sessions')
        .select('*')
        .eq('organizer_id', organizer.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return <DashboardContent user={user} sessions={sessions || []} />;
}
