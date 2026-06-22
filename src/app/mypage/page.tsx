'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ideaService, Idea } from '../../services/ideaService';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const { user, loading } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (user) {
      loadIdeas();
    }
  }, [user, loading]);

  const loadIdeas = async () => {
    if (!user) return;
    try {
      const data = await ideaService.getIdeas(user.id);
      setIdeas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('本当に削除しますか？')) {
      await ideaService.deleteIdea(id, user.id);
      setIdeas(ideas.filter(idea => idea.id !== id));
    }
  };

  if (loading || fetching) return <div className="text-center p-10">Loading...</div>;
  if (!user) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">マイページ (保存済みアイデア)</h1>
      
      {ideas.length === 0 ? (
        <p className="text-gray-500">まだアイデアが保存されていません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <div key={idea.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-bold mb-2">{idea.title}</h2>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{idea.summary}</p>
              
              <div className="text-xs text-gray-500 mb-4">
                <strong>ターゲット:</strong> {idea.target}
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-400">
                  {new Date(idea.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(idea.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
