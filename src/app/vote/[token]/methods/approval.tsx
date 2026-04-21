'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Artwork } from '@/types/database';

export function ApprovalVote({
  artworks,
  onSubmit,
}: {
  artworks: Artwork[];
  onSubmit: (data: { artwork_ids: string[] }) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">承認投票</h2>
        <p className="text-sm text-muted-foreground">良いと思う作品をすべて選んでください（複数可）</p>
      </div>

      <div className="text-center">
        <span className="text-sm font-medium">選択中: {selected.size}件</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {artworks.map(a => (
          <Card
            key={a.id}
            className={`cursor-pointer transition-all ${
              selected.has(a.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => toggle(a.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <Checkbox checked={selected.has(a.id)} />
              {a.image_url && (
                <img src={a.image_url} alt={a.title} className="w-16 h-16 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{a.title}</p>
                {a.creator_name && <p className="text-xs text-muted-foreground">{a.creator_name}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={selected.size === 0}
        onClick={() => onSubmit({ artwork_ids: Array.from(selected) })}
      >
        確定して次へ（{selected.size}件選択中）
      </Button>
    </div>
  );
}
