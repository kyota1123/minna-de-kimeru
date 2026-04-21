import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">ページが見つかりません</p>
        <Link href="/">
          <Button variant="outline">トップに戻る</Button>
        </Link>
      </div>
    </div>
  );
}
