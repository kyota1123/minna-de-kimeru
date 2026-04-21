'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { User } from '@supabase/supabase-js';
import type { VotingSession } from '@/types/database';

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

export function DashboardContent({ user, sessions }: { user: User; sessions: VotingSession[] }) {
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
          <Link href="/dashboard/new">
            <Button>新規作成</Button>
          </Link>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">セッションがありません</CardTitle>
              <CardDescription>
                「新規作成」ボタンから最初の投票セッションを作成しましょう。
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map(s => (
              <Link key={s.id} href={`/dashboard/${s.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{s.title}</CardTitle>
                      <Badge className={STATUS_COLORS[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                    </div>
                    {s.description && (
                      <CardDescription className="line-clamp-2">{s.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      作成: {new Date(s.created_at).toLocaleDateString('ja-JP')}
                      {s.participant_id_mode === 'nickname' ? ' / 記名' : ' / 匿名'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
