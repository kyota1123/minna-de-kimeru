import type {
  VotingMethod,
  MajorityVoteData,
  ApprovalVoteData,
  IrvVoteData,
  RangeVoteData,
  QvVoteData,
  MetaVote,
} from '@/types/database';

export function calculateMajority(votes: MajorityVoteData[]) {
  const counts: Record<string, number> = {};
  for (const v of votes) {
    counts[v.artwork_id] = (counts[v.artwork_id] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const winner = sorted.length > 0 ? sorted[0][0] : '';
  return { counts, winner };
}

export function calculateApproval(votes: ApprovalVoteData[]) {
  const counts: Record<string, number> = {};
  for (const v of votes) {
    for (const id of v.artwork_ids) {
      counts[id] = (counts[id] || 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const winner = sorted.length > 0 ? sorted[0][0] : '';
  return { counts, winner };
}

export function calculateIrv(votes: IrvVoteData[], artworkIds: string[]) {
  const active = new Set(artworkIds);
  const eliminated: string[] = [];
  const rounds: Array<Record<string, number>> = [];

  while (active.size > 1) {
    const roundCounts: Record<string, number> = {};
    for (const id of active) roundCounts[id] = 0;

    for (const v of votes) {
      const topChoice = v.rankings
        .sort((a, b) => a.rank - b.rank)
        .find(r => active.has(r.artwork_id));
      if (topChoice) {
        roundCounts[topChoice.artwork_id] = (roundCounts[topChoice.artwork_id] || 0) + 1;
      }
    }

    rounds.push({ ...roundCounts });

    const totalVotes = Object.values(roundCounts).reduce((s, n) => s + n, 0);
    const majority = Math.floor(totalVotes / 2) + 1;
    const sorted = Object.entries(roundCounts).sort((a, b) => b[1] - a[1]);

    if (sorted.length > 0 && sorted[0][1] >= majority) {
      return { rounds, winner: sorted[0][0], eliminated };
    }

    // Find loser (lowest count)
    const minCount = Math.min(...Object.values(roundCounts));
    const losers = Object.entries(roundCounts).filter(([, c]) => c === minCount);
    const loser = losers[losers.length - 1][0]; // Take last if tied
    active.delete(loser);
    eliminated.push(loser);
  }

  return { rounds, winner: Array.from(active)[0] || '', eliminated };
}

export function calculateRange(votes: RangeVoteData[]) {
  const totals: Record<string, number> = {};
  for (const v of votes) {
    for (const [id, score] of Object.entries(v.scores)) {
      totals[id] = (totals[id] || 0) + score;
    }
  }
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const winner = sorted.length > 0 ? sorted[0][0] : '';
  return { totals, winner };
}

export function calculateQv(votes: QvVoteData[]) {
  const totals: Record<string, number> = {};
  for (const v of votes) {
    for (const [id, count] of Object.entries(v.credits)) {
      totals[id] = (totals[id] || 0) + count;
    }
  }
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const winner = sorted.length > 0 ? sorted[0][0] : '';
  return { totals, winner };
}

export function determineAdoptedMethods(metaVotes: MetaVote[]) {
  const counts: Record<VotingMethod, number> = {
    majority: 0, approval: 0, irv: 0, range: 0, qv: 0,
  };
  let noneCount = 0;

  for (const mv of metaVotes) {
    if (mv.none_selected) {
      noneCount++;
      continue;
    }
    for (const method of mv.approved_methods) {
      counts[method]++;
    }
  }

  const maxCount = Math.max(...Object.values(counts));
  const adopted = (Object.keys(counts) as VotingMethod[])
    .filter(m => counts[m] === maxCount && maxCount > 0);

  return { counts, noneCount, adopted };
}
