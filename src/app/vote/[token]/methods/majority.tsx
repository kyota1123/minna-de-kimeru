'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Artwork } from '@/types/database';

export function MajorityVote({
  artworks,
  onSubmit,
}: {
  artworks: Artwork[];
  onSubmit: (data: { artwork_id: string }) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">多数決</h2>
        <p className="text-sm text-muted-foreground">最も良いと思う作品を1つ選んでください</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {artworks.map(a => (
          <Card
            key={a.id}
            className={`cursor-pointer transition-all ${
              selected === a.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelected(a.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                selected === a.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selected === a.id && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
              {a.image_url && (
                <img src={a.image_url} alt={a.title} className="w-16 h-16 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{a.title}</p>
                {a.creator_name && <p className="text-xs text-muted-foreground">{a.creator_name}</p>}
                {a.description && <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!selected}
        onClick={() => selected && onSubmit({ artwork_id: selected })}
      >
        確定して次へ
      </Button>
    </div>
  );
}
