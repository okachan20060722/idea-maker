'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ideaService, Idea } from '../../services/ideaService';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const [favorites, setFavorites] = useState<Idea[]>([]);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (user) {
      loadFavorites();
    }
  }, [user, loading]);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const data = await ideaService.getFavorites(user.id);
      setFavorites(data.filter(Boolean)); // filter nulls just in case
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleRemoveFavorite = async (ideaId: string) => {
    if (!user) return;
    try {
      await ideaService.toggleFavorite(ideaId, user.id);
      setFavorites(favorites.filter(idea => idea.id !== ideaId));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || fetching) return <div className="text-center p-10">Loading...</div>;
  if (!user) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">お気に入りアイデア</h1>
      
      {favorites.length === 0 ? (
        <p className="text-gray-500">お気に入りに登録されたアイデアはありません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((idea) => (
            <div key={idea.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative">
              <button 
                onClick={() => handleRemoveFavorite(idea.id)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
              >
                <Heart fill="currentColor" size={24} />
              </button>
              
              <h2 className="text-xl font-bold mb-2 pr-8">{idea.title}</h2>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{idea.summary}</p>
              
              <div className="text-xs text-gray-500 mb-4">
                <strong>マネタイズ:</strong> {idea.monetization}
              </div>
              
              <div className="mt-4">
                <span className="text-xs text-gray-400">
                  {new Date(idea.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
