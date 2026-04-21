'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getBrowserId } from '@/lib/participant';
import { Progress } from '@/components/ui/progress';
import { MajorityVote } from './methods/majority';
import { ApprovalVote } from './methods/approval';
import { IrvVote } from './methods/irv';
import { RangeVote } from './methods/range';
import { QvVote } from './methods/qv';
import type { VotingSession, Artwork, VotingMethod } from '@/types/database';

const METHOD_LABELS: Record<VotingMethod, string> = {
  majority: '多数決',
  approval: '承認投票',
  irv: '順位付け投票',
  range: 'レンジ投票',
  qv: 'クレジット配分',
};

export function VoteProcess({
  session,
  artworks,
  token,
}: {
  session: VotingSession;
  artworks: Artwork[];
  token: string;
}) {
  const router = useRouter();
  const methods = session.methods_config.order as VotingMethod[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedMethods, setCompletedMethods] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const browserId = getBrowserId();

      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('session_id', session.id)
        .eq('browser_id', browserId)
        .single();

      if (!participant) {
        router.push(`/join/${token}`);
        return;
      }

      setParticipantId(participant.id);

      // Check already submitted votes to resume
      const { data: votes } = await supabase
        .from('votes')
        .select('method')
        .eq('participant_id', participant.id);

      if (votes) {
        const done = new Set(votes.map(v => v.method));
        setCompletedMethods(done);
        // Find first incomplete method
        const nextIndex = methods.findIndex(m => !done.has(m));
        if (nextIndex === -1) {
          // All methods complete, go to completion page
          router.push(`/vote/${token}/complete`);
          return;
        }
        setCurrentIndex(nextIndex);
      }

      setLoading(false);
    };
    init();
  }, [session.id, token, router, methods]);

  const handleSubmit = async (method: VotingMethod, voteData: unknown) => {
    if (!participantId) return;
    const supabase = createClient();

    const { error } = await supabase.from('votes').insert({
      participant_id: participantId,
      method,
      vote_data: voteData,
    });

    if (error) {
      console.error('Vote submit error:', error);
      return;
    }

    const newCompleted = new Set(completedMethods);
    newCompleted.add(method);
    setCompletedMethods(newCompleted);

    if (currentIndex < methods.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push(`/vote/${token}/complete`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  const currentMethod = methods[currentIndex];
  const progress = ((currentIndex) / methods.length) * 100;

  const methodProps = {
    artworks,
    onSubmit: (data: unknown) => handleSubmit(currentMethod, data),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{METHOD_LABELS[currentMethod]}</span>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {methods.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {currentMethod === 'majority' && <MajorityVote {...methodProps} />}
        {currentMethod === 'approval' && <ApprovalVote {...methodProps} />}
        {currentMethod === 'irv' && <IrvVote {...methodProps} />}
        {currentMethod === 'range' && <RangeVote {...methodProps} />}
        {currentMethod === 'qv' && <QvVote {...methodProps} />}
      </main>
    </div>
  );
}
