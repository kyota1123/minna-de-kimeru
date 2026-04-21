import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ResultView } from './result-view';
import type { VotingMethod, MajorityVoteData, ApprovalVoteData, IrvVoteData, RangeVoteData, QvVoteData, MetaVote, Artwork, FreeComment } from '@/types/database';
import {
  calculateMajority,
  calculateApproval,
  calculateIrv,
  calculateRange,
  calculateQv,
  determineAdoptedMethods,
} from '@/lib/tally';

export default async function ResultPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('id', session_id)
    .single();

  if (!session) redirect('/');

  // Access control: if not published, only organizer can view
  if (!session.result_published) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/');
    const { data: organizer } = await supabase
      .from('organizers')
      .select('id')
      .eq('google_id', user.id)
      .eq('id', session.organizer_id)
      .single();
    if (!organizer) redirect('/');
  }

  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('session_id', session_id)
    .order('display_order');

  const { data: participants } = await supabase
    .from('participants')
    .select('id')
    .eq('session_id', session_id);

  const participantIds = (participants || []).map(p => p.id);

  // Fetch all votes
  const { data: allVotes } = participantIds.length > 0
    ? await supabase
        .from('votes')
        .select('*')
        .in('participant_id', participantIds)
    : { data: [] };

  const { data: metaVotesRaw } = participantIds.length > 0
    ? await supabase
        .from('meta_votes')
        .select('*')
        .in('participant_id', participantIds)
    : { data: [] };

  const { data: commentsRaw } = participantIds.length > 0
    ? await supabase
        .from('free_comments')
        .select('*')
        .in('participant_id', participantIds)
    : { data: [] };

  const votes = allVotes || [];
  const artworkList = artworks || [];
  const artworkIds = artworkList.map(a => a.id);
  const artworkMap = Object.fromEntries(artworkList.map(a => [a.id, a]));

  // Calculate results per method
  const majorityVotes = votes.filter(v => v.method === 'majority').map(v => v.vote_data as MajorityVoteData);
  const approvalVotes = votes.filter(v => v.method === 'approval').map(v => v.vote_data as ApprovalVoteData);
  const irvVotes = votes.filter(v => v.method === 'irv').map(v => v.vote_data as IrvVoteData);
  const rangeVotes = votes.filter(v => v.method === 'range').map(v => v.vote_data as RangeVoteData);
  const qvVotes = votes.filter(v => v.method === 'qv').map(v => v.vote_data as QvVoteData);

  const results = {
    majority: calculateMajority(majorityVotes),
    approval: calculateApproval(approvalVotes),
    irv: calculateIrv(irvVotes, artworkIds),
    range: calculateRange(rangeVotes),
    qv: calculateQv(qvVotes),
  };

  const metaVotes = (metaVotesRaw || []) as MetaVote[];
  const metaResult = determineAdoptedMethods(metaVotes);
  const comments = (commentsRaw || []) as FreeComment[];

  return (
    <ResultView
      session={session}
      artworks={artworkList}
      artworkMap={artworkMap}
      results={results}
      metaResult={metaResult}
      metaVotes={metaVotes}
      comments={comments}
      participantCount={participantIds.length}
    />
  );
}
