'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Artwork } from '@/types/database';

function SortableItem({ artwork, rank }: { artwork: Artwork; rank: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: artwork.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-grab active:cursor-grabbing">
        <CardContent className="flex items-center gap-4 p-4" {...attributes} {...listeners}>
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {rank}
          </div>
          {artwork.image_url && (
            <img src={artwork.image_url} alt={artwork.title} className="w-12 h-12 object-cover rounded" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium">{artwork.title}</p>
            {artwork.creator_name && <p className="text-xs text-muted-foreground">{artwork.creator_name}</p>}
          </div>
          <span className="text-muted-foreground text-lg flex-shrink-0">⠿</span>
        </CardContent>
      </Card>
    </div>
  );
}

export function IrvVote({
  artworks,
  onSubmit,
}: {
  artworks: Artwork[];
  onSubmit: (data: { rankings: Array<{ artwork_id: string; rank: number }> }) => void;
}) {
  const [items, setItems] = useState(artworks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIndex = prev.findIndex(i => i.id === active.id);
        const newIndex = prev.findIndex(i => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    setItems(prev => arrayMove(prev, index, newIndex));
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">順位付け投票</h2>
        <p className="text-sm text-muted-foreground">ドラッグまたは矢印で好きな順に並べ替えてください（上が1位）</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <button
                    className="text-xs p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                  >
                    ▲
                  </button>
                  <button
                    className="text-xs p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                  >
                    ▼
                  </button>
                </div>
                <div className="flex-1">
                  <SortableItem artwork={item} rank={index + 1} />
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        className="w-full"
        size="lg"
        onClick={() =>
          onSubmit({
            rankings: items.map((item, i) => ({ artwork_id: item.id, rank: i + 1 })),
          })
        }
      >
        確定して次へ
      </Button>
    </div>
  );
}
