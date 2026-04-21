import { createClient } from '@/lib/supabase/client';

async function compressImage(
  file: File,
  opts: { maxDimension: number; quality: number }
): Promise<Blob> {
  const img = await createImageBitmap(file);
  const scale = Math.min(opts.maxDimension / img.width, opts.maxDimension / img.height, 1);
  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', opts.quality);
  });
}

export async function uploadArtworkImage(
  file: File,
  sessionId: string,
  artworkId: string
): Promise<string> {
  const compressed = await compressImage(file, {
    maxDimension: 1200,
    quality: 0.85,
  });

  const path = `${sessionId}/${artworkId}.webp`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from('artworks')
    .upload(path, compressed, { upsert: true, contentType: 'image/webp' });

  if (error) throw error;

  const { data } = supabase.storage.from('artworks').getPublicUrl(path);
  return data.publicUrl;
}
