'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Artwork } from '@/types/database';

const MAX_CREDITS = 25;

function getCost(votes: number): number {
  return votes * votes;
}

export function QvVote({
  artworks,
  onSubmit,
}: {
  artworks: Artwork[];
  onSubmit: (data: { credits: Record<string, number> }) => void;
}) {
  const [votes, setVotes] = useState<Record<string, number>>(
    Object.fromEntries(artworks.map(a => [a.id, 0]))
  );

  const totalCost = Object.values(votes).reduce((sum, v) => sum + getCost(v), 0);
  const remaining = MAX_CREDITS - totalCost;

  const increment = (id: string) => {
    const current = votes[id];
    const nextCost = getCost(current + 1) - getCost(current);
    if (remaining >= nextCost) {
      setVotes(prev => ({ ...prev, [id]: current + 1 }));
    }
  };

  const decrement = (id: string) => {
    if (votes[id] > 0) {
      setVotes(prev => ({ ...prev, [id]: prev[id] - 1 }));
    }
  };

  const canIncrement = (id: string): boolean => {
    const current = votes[id];
    const nextCost = getCost(current + 1) - getCost(current);
    return remaining >= nextCost;
  };

  const hasVotes = Object.values(votes).some(v => v > 0);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">クレジット配分</h2>
        <p className="text-sm text-muted-foreground">25クレジットを配分してください（票数の二乗がコスト）</p>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-white border rounded-lg px-4 py-2">
          <span className="text-sm">残りクレジット:</span>
          <span className={`text-2xl font-bold ${remaining === 0 ? 'text-red-500' : 'text-blue-500'}`}>
            {remaining}
          </span>
          <span className="text-xs text-muted-foreground">/ {MAX_CREDITS}</span>
        </div>
      </div>

      <div className="space-y-3">
        {artworks.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {a.image_url && (
                  <img src={a.image_url} alt={a.title} className="w-12 h-12 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{a.title}</p>
                  {a.creator_name && <p className="text-xs text-muted-foreground">{a.creator_name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 text-lg font-bold"
                    onClick={() => decrement(a.id)}
                    disabled={votes[a.id] === 0}
                  >
                    -
                  </button>
                  <div className="w-12 text-center">
                    <div className="text-lg font-bold">{votes[a.id]}</div>
                    <div className="text-xs text-muted-foreground">{getCost(votes[a.id])}c</div>
                  </div>
                  <button
                    className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-30 text-lg font-bold"
                    onClick={() => increment(a.id)}
                    disabled={!canIncrement(a.id)}
                  >
                    +
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        コスト: 1票=1c, 2票=4c, 3票=9c, 4票=16c, 5票=25c
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!hasVotes}
        onClick={() => {
          const finalCredits: Record<string, number> = {};
          for (const [id, v] of Object.entries(votes)) {
            if (v > 0) finalCredits[id] = v;
          }
          onSubmit({ credits: finalCredits });
        }}
      >
        確定して次へ
      </Button>
    </div>
  );
}
