'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getFirebaseErrorMessage } from '@/lib/firebaseError';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      alert(getFirebaseErrorMessage(error));
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-md">
      <Link href="/" className="text-xl font-bold">
        Idea Maker
      </Link>
      
      <nav>
        {!loading && (
          <ul className="flex space-x-6 items-center">
            {pathname !== '/' && (
              <li>
                <Link href="/" className="hover:text-gray-300">
                  ホーム
                </Link>
              </li>
            )}
            <li>
              <Link href="/timeline" className="hover:text-gray-300">
                みんなのアイデア
              </Link>
            </li>
            <li>
              <Link href="/mypage" className="hover:text-gray-300">
                マイページ
              </Link>
            </li>
            {user ? (
              <>
                <li>
                  <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition">
                    ログアウト
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link href="/login" className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition">
                  ログイン
                </Link>
              </li>
            )}
          </ul>
        )}
      </nav>
    </header>
  );
}
