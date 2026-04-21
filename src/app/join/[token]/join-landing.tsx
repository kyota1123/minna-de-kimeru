'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getBrowserId } from '@/lib/participant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VotingSession, Artwork } from '@/types/database';

export function JoinLanding({
  session,
  artworks,
  token,
}: {
  session: VotingSession;
  artworks: Artwork[];
  token: string;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [joining, setJoining] = useState(false);
  const [showNickname, setShowNickname] = useState(false);

  const isNicknameMode = session.participant_id_mode === 'nickname';
  const isActive = session.status === 'active';

  const handleStart = async () => {
    if (isNicknameMode && !showNickname) {
      setShowNickname(true);
      return;
    }

    setJoining(true);
    try {
      const supabase = createClient();
      const browserId = getBrowserId();

      // Check if already joined
      const { data: existing } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('browser_id', browserId)
        .single();

      if (existing) {
        // Resume from where they left off
        router.push(`/vote/${token}`);
        return;
      }

      // Get next participant number
      const { count } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);

      const participantNumber = (count || 0) + 1;

      const { error } = await supabase.from('participants').insert({
        session_id: session.id,
        participant_number: participantNumber,
        nickname: isNicknameMode ? nickname.trim() || null : null,
        browser_id: browserId,
      });

      if (error) throw error;
      router.push(`/vote/${token}`);
    } catch (e) {
      console.error('Failed to join:', e);
      alert('参加に失敗しました。もう一度お試しください。');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{session.title}</CardTitle>
          {session.description && (
            <CardDescription className="text-base">{session.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>5つの投票手法を体験します</p>
            <p>作品数: {artworks.length}件</p>
          </div>

          {!isActive && (
            <p className="text-center text-sm text-red-600">
              {session.status === 'draft' ? 'この投票はまだ開始されていません。' : 'この投票は終了しました。'}
            </p>
          )}

          {isActive && showNickname && isNicknameMode && (
            <div className="space-y-2">
              <Input
                placeholder="ニックネームを入力"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={!isActive || joining || (showNickname && isNicknameMode && !nickname.trim())}
          >
            {joining ? '参加中...' : showNickname ? '投票を始める' : isActive ? '参加する' : '参加できません'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
