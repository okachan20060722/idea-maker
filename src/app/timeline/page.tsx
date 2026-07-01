"use client";

import React, { useEffect, useState } from 'react';
import { ideaService, Idea } from '@/services/ideaService';
import { useAuth } from '@/hooks/useAuth';
import { Globe } from 'lucide-react';
import IdeaCard from '@/components/IdeaCard';
import IdeaModal from '@/components/IdeaModal';
import PublishModal from '@/components/PublishModal';

export default function TimelinePage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [publishModalIdea, setPublishModalIdea] = useState<Idea | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true);
      try {
        const publicIdeas = await ideaService.getPublicIdeas();
        setIdeas(publicIdeas);
      } catch (error) {
        console.error("Failed to fetch public ideas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  const updateIdeaInList = (updatedIdea: Idea) => {
    setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    if (selectedIdea?.id === updatedIdea.id) {
      setSelectedIdea(updatedIdea);
    }
  };

  const handleToggleFavorite = async (idea: Idea, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    try {
      const newStatus = await ideaService.toggleFavorite(idea.id, idea.user_id, user.uid);
      const newFavoritedBy = newStatus 
        ? [...(idea.favoritedBy || []), user.uid] 
        : (idea.favoritedBy || []).filter(id => id !== user.uid);
      updateIdeaInList({ ...idea, favoritedBy: newFavoritedBy });
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました');
    }
  };

  const handleToggleLike = async (idea: Idea, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    try {
      const newStatus = await ideaService.toggleLike(idea.id, idea.user_id, user.uid);
      const newLikedBy = newStatus 
        ? [...(idea.likedBy || []), user.uid] 
        : (idea.likedBy || []).filter(id => id !== user.uid);
      const newLikesCount = (idea.likesCount || 0) + (newStatus ? 1 : -1);
      updateIdeaInList({ ...idea, likedBy: newLikedBy, likesCount: newLikesCount });
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました');
    }
  };

  const handleTogglePublicClick = async (idea: Idea) => {
    if (!user) return;
    if (idea.isPublic) {
      if (confirm('非公開にしますか？')) {
        try {
          await ideaService.unpublishIdea(idea.id, user.uid);
          updateIdeaInList({ ...idea, isPublic: false });
          // Remove from timeline as it's no longer public
          setIdeas(prev => prev.filter(i => i.id !== idea.id));
          if (selectedIdea?.id === idea.id) setIsModalOpen(false);
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      setPublishModalIdea(idea);
      setIsPublishModalOpen(true);
    }
  };

  const handlePublishConfirm = async (ideaId: string, tags: string[], commentsEnabled: boolean) => {
    if (!user || !publishModalIdea) return;
    try {
      await ideaService.publishIdea(ideaId, user.uid, tags, commentsEnabled);
      updateIdeaInList({ ...publishModalIdea, isPublic: true, tags, commentsEnabled });
      setIsPublishModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('公開に失敗しました');
    }
  };

  const handleDelete = async (ideaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    if (confirm('本当に削除しますか？')) {
      await ideaService.deleteIdea(ideaId, user.uid);
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
      if (selectedIdea?.id === ideaId) {
        setIsModalOpen(false);
      }
    }
  };

  const openModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500">タイムラインを読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4 text-indigo-600">
          <Globe size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">みんなのアイデア</h1>
        <p className="text-gray-600">
          他のユーザーが公開したアイデアのタイムラインです。新しいひらめきを見つけましょう。
        </p>
      </header>

      {ideas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Globe className="text-gray-300" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">まだ投稿がありません</h2>
          <p className="text-gray-500">
            あなたのアイデアをSNSに投稿して、最初の投稿者になりましょう！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onClick={() => openModal(idea)}
              currentUserId={user?.uid}
              onToggleFavorite={handleToggleFavorite}
              onToggleLike={handleToggleLike}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <IdeaModal
        idea={selectedIdea}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={user?.uid}
        currentUserName={user?.displayName || '名無し'}
        onToggleFavorite={(idea) => handleToggleFavorite(idea)}
        onToggleLike={(idea) => handleToggleLike(idea)}
        onTogglePublic={handleTogglePublicClick}
        onDelete={handleDelete}
      />

      {/* Publish Modal */}
      <PublishModal
        idea={publishModalIdea}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublishConfirm}
      />
    </main>
  );
}
