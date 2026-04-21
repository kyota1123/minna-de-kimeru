import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">みんなで決める</h1>
        <p className="text-lg text-muted-foreground">
          5つの投票手法を体験して、<br />
          「決め方」の違いを発見するワークショップアプリ
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login">
            <Button size="lg">主催者ログイン</Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          参加者の方は主催者から共有されたリンクからアクセスしてください
        </p>
      </div>
    </div>
  );
}
