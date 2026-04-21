'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadArtworkImage } from '@/lib/image-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ParticipantIdMode, ResultVisibility } from '@/types/database';

interface ArtworkDraft {
  tempId: string;
  title: string;
  description: string;
  creator_name: string;
  file: File | null;
  previewUrl: string | null;
}

export function NewSessionForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [participantIdMode, setParticipantIdMode] = useState<ParticipantIdMode>('anonymous');
  const [resultVisibility, setResultVisibility] = useState<ResultVisibility>('after_end');
  const [artworks, setArtworks] = useState<ArtworkDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const addArtwork = () => {
    setArtworks([...artworks, {
      tempId: crypto.randomUUID(),
      title: '',
      description: '',
      creator_name: '',
      file: null,
      previewUrl: null,
    }]);
  };

  const updateArtwork = (tempId: string, updates: Partial<ArtworkDraft>) => {
    setArtworks(artworks.map(a => a.tempId === tempId ? { ...a, ...updates } : a));
  };

  const removeArtwork = (tempId: string) => {
    setArtworks(artworks.filter(a => a.tempId !== tempId));
  };

  const handleImageChange = (tempId: string, file: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    updateArtwork(tempId, { file, previewUrl });
  };

  const handleSubmit = async () => {
    if (!title.trim() || artworks.length === 0) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get organizer
      const { data: organizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('google_id', user.id)
        .single();
      if (!organizer) return;

      const shareToken = crypto.randomUUID().slice(0, 8);

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .insert({
          organizer_id: organizer.id,
          title: title.trim(),
          description: description.trim() || null,
          participant_id_mode: participantIdMode,
          result_visibility: resultVisibility,
          share_token: shareToken,
          status: 'draft',
        })
        .select()
        .single();

      if (sessionError || !session) throw sessionError;

      // Create artworks
      for (let i = 0; i < artworks.length; i++) {
        const a = artworks[i];
        const { data: artwork, error: artworkError } = await supabase
          .from('artworks')
          .insert({
            session_id: session.id,
            title: a.title.trim() || `作品 ${i + 1}`,
            description: a.description.trim() || null,
            creator_name: a.creator_name.trim() || null,
            display_order: i,
          })
          .select()
          .single();

        if (artworkError || !artwork) throw artworkError;

        // Upload image if present
        if (a.file) {
          const imageUrl = await uploadArtworkImage(a.file, session.id, artwork.id);
          await supabase
            .from('artworks')
            .update({ image_url: imageUrl })
            .eq('id', artwork.id);
        }
      }

      router.push(`/dashboard/${session.id}`);
    } catch (e) {
      console.error('Failed to create session:', e);
      alert('セッションの作成に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">新規投票セッション</h1>
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>戻る</Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="例：デザインコンペ投票" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">説明</Label>
              <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="投票の説明（任意）" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>参加者識別</Label>
                <Select value={participantIdMode} onValueChange={v => setParticipantIdMode(v as ParticipantIdMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anonymous">匿名</SelectItem>
                    <SelectItem value="nickname">ニックネーム</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>結果公開</Label>
                <Select value={resultVisibility} onValueChange={v => setResultVisibility(v as ResultVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">リアルタイム</SelectItem>
                    <SelectItem value="after_end">終了後</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Artworks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>作品・選択肢</CardTitle>
              <Button variant="outline" size="sm" onClick={addArtwork}>+ 追加</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {artworks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">「+ 追加」ボタンで作品を追加してください</p>
            )}
            {artworks.map((a, i) => (
              <div key={a.tempId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">作品 {i + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeArtwork(a.tempId)}>削除</Button>
                </div>
                <Input placeholder="タイトル" value={a.title} onChange={e => updateArtwork(a.tempId, { title: e.target.value })} />
                <Input placeholder="作者名（任意）" value={a.creator_name} onChange={e => updateArtwork(a.tempId, { creator_name: e.target.value })} />
                <Textarea placeholder="説明（任意）" value={a.description} onChange={e => updateArtwork(a.tempId, { description: e.target.value })} rows={2} />
                <div>
                  <Input type="file" accept="image/*" onChange={e => handleImageChange(a.tempId, e.target.files?.[0] || null)} />
                  {a.previewUrl && (
                    <img src={a.previewUrl} alt="preview" className="mt-2 max-h-40 rounded object-cover" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim() || artworks.length === 0}>
            {saving ? '作成中...' : 'セッションを作成'}
          </Button>
        </div>
      </main>
    </div>
  );
}
