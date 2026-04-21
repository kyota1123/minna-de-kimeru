'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';

export function DashboardContent({ user }: { user: User }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">みんなで決める</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user.user_metadata.full_name || user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">投票セッション</h2>
          <Button>新規作成</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">セッションがありません</CardTitle>
            <CardDescription>
              「新規作成」ボタンから最初の投票セッションを作成しましょう。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              投票セッションを作成すると、参加者に共有リンクを配布して投票を開始できます。
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
