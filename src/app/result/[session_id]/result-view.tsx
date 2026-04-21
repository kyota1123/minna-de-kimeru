'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type {
  VotingSession,
  Artwork,
  VotingMethod,
  MetaVote,
  FreeComment,
} from '@/types/database';

const METHOD_LABELS: Record<VotingMethod, string> = {
  majority: '多数決',
  approval: '承認投票',
  irv: '順位付け投票',
  range: 'レンジ投票',
  qv: 'クレジット配分',
};

interface MethodResult {
  winner: string;
  counts?: Record<string, number>;
  totals?: Record<string, number>;
  rounds?: Array<Record<string, number>>;
  eliminated?: string[];
}

interface MetaResult {
  counts: Record<VotingMethod, number>;
  noneCount: number;
  adopted: VotingMethod[];
}

export function ResultView({
  session,
  artworks,
  artworkMap,
  results,
  metaResult,
  metaVotes,
  comments,
  participantCount,
}: {
  session: VotingSession;
  artworks: Artwork[];
  artworkMap: Record<string, Artwork>;
  results: Record<string, MethodResult>;
  metaResult: MetaResult;
  metaVotes: MetaVote[];
  comments: FreeComment[];
  participantCount: number;
}) {
  const methods = session.methods_config.order as VotingMethod[];
  const [expandedMethod, setExpandedMethod] = useState<VotingMethod | null>(null);

  const getArtworkName = (id: string) => artworkMap[id]?.title || '不明';

  // Find adopted method winner(s)
  const adoptedWinners = metaResult.adopted.map(m => ({
    method: m,
    winner: results[m]?.winner,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 text-center">
          <h1 className="text-2xl font-bold">{session.title} — 結果</h1>
          <p className="text-sm text-muted-foreground mt-1">{participantCount}人が投票</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Hero: Adopted result */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">採用された結果</CardTitle>
            {metaResult.adopted.length === 0 ? (
              <p className="text-muted-foreground">メタ投票がまだありません</p>
            ) : metaResult.adopted.length === 1 ? (
              <p className="text-sm text-muted-foreground">
                「{METHOD_LABELS[metaResult.adopted[0]]}」が採用手法として選ばれました
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                複数の手法が同点で採用されました
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              {adoptedWinners.map(({ method, winner }) => (
                <div key={method} className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Badge className="mb-2">{METHOD_LABELS[method]}</Badge>
                  {winner && artworkMap[winner] && (
                    <>
                      {artworkMap[winner].image_url && (
                        <img
                          src={artworkMap[winner].image_url!}
                          alt={artworkMap[winner].title}
                          className="w-32 h-32 object-cover rounded mx-auto mb-2"
                        />
                      )}
                      <p className="font-bold text-lg">{artworkMap[winner].title}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meta vote bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">メタ承認投票の結果</CardTitle>
            <p className="text-sm text-muted-foreground">
              「どの手法を採用するか」への投票結果（{metaVotes.length}票）
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {methods.map(method => {
              const count = metaResult.counts[method];
              const maxCount = Math.max(...Object.values(metaResult.counts), 1);
              const pct = (count / maxCount) * 100;
              return (
                <div key={method} className="flex items-center gap-3">
                  <span className="text-sm w-28 flex-shrink-0">{METHOD_LABELS[method]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                    <div
                      className={`h-full rounded-full ${
                        metaResult.adopted.includes(method) ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              );
            })}
            {metaResult.noneCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm w-28 flex-shrink-0 text-red-600">望ましくない</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                  <div className="h-full rounded-full bg-red-400" style={{ width: `${(metaResult.noneCount / Math.max(...Object.values(metaResult.counts), 1)) * 100}%` }} />
                </div>
                <span className="text-sm font-medium w-8 text-right">{metaResult.noneCount}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5 method results - collapsible */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">5手法の結果</h2>
          {methods.map(method => {
            const result = results[method];
            const isExpanded = expandedMethod === method;
            const data = result.counts || result.totals || {};

            return (
              <Card key={method}>
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedMethod(isExpanded ? null : method)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{METHOD_LABELS[method]}</CardTitle>
                        {metaResult.adopted.includes(method) && (
                          <Badge variant="outline" className="text-xs">採用</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.winner && (
                          <span className="text-sm font-medium">
                            1位: {getArtworkName(result.winner)}
                          </span>
                        )}
                        <span className="text-muted-foreground">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-2">
                    <Separator />
                    {Object.entries(data)
                      .sort((a, b) => b[1] - a[1])
                      .map(([artworkId, value]) => {
                        const maxVal = Math.max(...Object.values(data), 1);
                        return (
                          <div key={artworkId} className="flex items-center gap-3">
                            <span className="text-sm w-32 truncate flex-shrink-0">
                              {getArtworkName(artworkId)}
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-5">
                              <div
                                className={`h-full rounded-full ${
                                  artworkId === result.winner ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                                style={{ width: `${(value / maxVal) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{value}</span>
                          </div>
                        );
                      })}
                    {method === 'irv' && result.rounds && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        <p>ラウンド数: {result.rounds.length}</p>
                        {result.eliminated && result.eliminated.length > 0 && (
                          <p>除外順: {result.eliminated.map(id => getArtworkName(id)).join(' → ')}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Comments */}
        {comments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">コメント（{comments.length}件）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{c.comment_text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
