'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getBrowserId } from '@/lib/participant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { VotingSession, VotingMethod } from '@/types/database';

const METHOD_LABELS: Record<VotingMethod, string> = {
  majority: '多数決',
  approval: '承認投票',
  irv: '順位付け投票',
  range: 'レンジ投票',
  qv: 'クレジット配分',
};

export function CompletionForm({
  session,
  token,
}: {
  session: VotingSession;
  token: string;
}) {
  const router = useRouter();
  const methods = session.methods_config.order as VotingMethod[];
  const [approvedMethods, setApprovedMethods] = useState<Set<VotingMethod>>(new Set());
  const [noneSelected, setNoneSelected] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);

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
      if (participant) setParticipantId(participant.id);

      // Check if already submitted
      if (participant) {
        const { data: existing } = await supabase
          .from('meta_votes')
          .select('id')
          .eq('participant_id', participant.id)
          .single();
        if (existing) setSubmitted(true);
      }
    };
    init();
  }, [session.id]);

  const toggleMethod = (method: VotingMethod) => {
    if (noneSelected) return;
    const next = new Set(approvedMethods);
    if (next.has(method)) next.delete(method);
    else next.add(method);
    setApprovedMethods(next);
  };

  const toggleNone = () => {
    setNoneSelected(!noneSelected);
    if (!noneSelected) setApprovedMethods(new Set());
  };

  const handleSubmit = async () => {
    if (!participantId) return;
    setSubmitting(true);

    try {
      const supabase = createClient();

      // Submit meta vote
      await supabase.from('meta_votes').insert({
        participant_id: participantId,
        approved_methods: Array.from(approvedMethods),
        none_selected: noneSelected,
      });

      // Submit free comment if any
      if (comment.trim()) {
        await supabase.from('free_comments').insert({
          participant_id: participantId,
          comment_text: comment.trim(),
        });
      }

      // Mark participant as completed
      await supabase
        .from('participants')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', participantId);

      setSubmitted(true);
    } catch (e) {
      console.error('Submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>投票完了</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">ご参加ありがとうございました！</p>
            {session.result_published && (
              <Button onClick={() => router.push(`/result/${session.id}`)}>
                結果を見る
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <h1 className="text-lg font-bold text-center">投票の振り返り</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Meta approval vote */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">採用手法の投票</CardTitle>
            <p className="text-sm text-muted-foreground">
              どの手法の結果を採用したいですか？（何個でも選択可）
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {methods.map(method => (
              <label
                key={method}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  approvedMethods.has(method)
                    ? 'bg-blue-50 border-blue-300'
                    : noneSelected
                      ? 'opacity-50'
                      : 'hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  checked={approvedMethods.has(method)}
                  onCheckedChange={() => toggleMethod(method)}
                  disabled={noneSelected}
                />
                <span className="font-medium">{METHOD_LABELS[method]}</span>
              </label>
            ))}
            <div className="border-t pt-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <Checkbox checked={noneSelected} onCheckedChange={toggleNone} />
                <span className="font-medium text-red-600">どれも望ましくない</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Free comment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">自由記述（任意）</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="comment" className="sr-only">コメント</Label>
            <Textarea
              id="comment"
              placeholder="感想や気づきがあれば自由にお書きください"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || (!noneSelected && approvedMethods.size === 0)}
        >
          {submitting ? '送信中...' : '送信して完了'}
        </Button>
      </main>
    </div>
  );
}
