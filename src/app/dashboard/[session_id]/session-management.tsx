'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VotingSession, Artwork, Participant } from '@/types/database';
import { QRCodeSVG } from 'qrcode.react';

const STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  active: '投票受付中',
  closed: '終了',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

export function SessionManagement({
  session: initialSession,
  artworks,
  participants: initialParticipants,
}: {
  session: VotingSession;
  artworks: Artwork[];
  participants: Participant[];
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [participants] = useState(initialParticipants);
  const [updating, setUpdating] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${session.share_token}`
    : '';

  const updateStatus = async (status: string, extra: Record<string, unknown> = {}) => {
    setUpdating(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('voting_sessions')
      .update({ status, ...extra })
      .eq('id', session.id)
      .select()
      .single();
    if (data) setSession(data as VotingSession);
    setUpdating(false);
  };

  const toggleResultPublished = async () => {
    setUpdating(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('voting_sessions')
      .update({ result_published: !session.result_published })
      .eq('id', session.id)
      .select()
      .single();
    if (data) setSession(data as VotingSession);
    setUpdating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>← 戻る</Button>
            <h1 className="text-lg font-bold">{session.title}</h1>
            <Badge className={STATUS_COLORS[session.status]}>{STATUS_LABELS[session.status]}</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Share link & QR */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">共有リンク</CardTitle>
              <CardDescription>参加者にこのリンクを配布してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shareUrl && (
                <>
                  <div className="flex justify-center">
                    <QRCodeSVG value={shareUrl} size={160} />
                  </div>
                  <div className="text-xs text-center break-all bg-gray-100 rounded p-2">{shareUrl}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                  >
                    リンクをコピー
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">参加者</CardTitle>
              <CardDescription>{participants.length}人が参��</CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">まだ参加者がいません</p>
              ) : (
                <ul className="space-y-1">
                  {participants.map(p => (
                    <li key={p.id} className="text-sm flex items-center justify-between">
                      <span>参加者{String(p.participant_number).padStart(2, '0')}</span>
                      <Badge variant="outline" className="text-xs">
                        {p.completed_at ? '完了' : '投票中'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.status === 'draft' && (
                <Button className="w-full" onClick={() => updateStatus('active')} disabled={updating}>
                  投票を開始
                </Button>
              )}
              {session.status === 'active' && (
                <Button className="w-full" variant="destructive" onClick={() => updateStatus('closed', { closed_at: new Date().toISOString() })} disabled={updating}>
                  投票を終了
                </Button>
              )}
              <Button
                className="w-full"
                variant="outline"
                onClick={toggleResultPublished}
                disabled={updating}
              >
                {session.result_published ? '結果を非公開にする' : '結果を公開する'}
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(`/result/${session.id}`)}
              >
                結果画面を表示
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Artworks list */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">作品一覧（{artworks.length}件）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworks.map(a => (
                <div key={a.id} className="border rounded-lg p-3 space-y-2">
                  {a.image_url && (
                    <img src={a.image_url} alt={a.title} className="w-full h-32 object-cover rounded" />
                  )}
                  <p className="text-sm font-medium">{a.title}</p>
                  {a.creator_name && <p className="text-xs text-muted-foreground">{a.creator_name}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
