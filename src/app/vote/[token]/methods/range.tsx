'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Artwork } from '@/types/database';

export function RangeVote({
  artworks,
  onSubmit,
}: {
  artworks: Artwork[];
  onSubmit: (data: { scores: Record<string, number> }) => void;
}) {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(artworks.map(a => [a.id, null]))
  );

  const scoredCount = Object.values(scores).filter(v => v !== null).length;

  const setScore = (id: string, score: number) => {
    setScores(prev => ({ ...prev, [id]: score }));
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">レンジ投票</h2>
        <p className="text-sm text-muted-foreground">各作品に0〜5点で点数をつけてください</p>
      </div>

      <div className="text-center">
        <span className="text-sm font-medium">採点済み: {scoredCount} / {artworks.length}件</span>
      </div>

      <div className="space-y-3">
        {artworks.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                {a.image_url && (
                  <img src={a.image_url} alt={a.title} className="w-12 h-12 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{a.title}</p>
                  {a.creator_name && <p className="text-xs text-muted-foreground">{a.creator_name}</p>}
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      scores[a.id] === n
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => setScore(a.id, n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={scoredCount === 0}
        onClick={() => {
          const finalScores: Record<string, number> = {};
          for (const [id, score] of Object.entries(scores)) {
            if (score !== null) finalScores[id] = score;
          }
          onSubmit({ scores: finalScores });
        }}
      >
        確定して次へ（{scoredCount}件採点済み）
      </Button>
    </div>
  );
}
