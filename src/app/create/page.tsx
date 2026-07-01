"use client";

import React, { useState, useEffect } from 'react';
import InputForm from '@/components/InputForm';
import ResultCard from '@/components/ResultCard';
import PublishModal from '@/components/PublishModal';
import { IdeaCondition, IdeaResult } from '@/types';
import { Idea } from '@/services/ideaService';
import { useAuth } from '@/hooks/useAuth';
import { ideaService } from '@/services/ideaService';

export default function CreateIdea() {
  const [result, setResult] = useState<IdeaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  
  const [publishModalIdea, setPublishModalIdea] = useState<Idea | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Reset saved states when result changes
  useEffect(() => {
    setSavedIdeaId(null);
    setIsFavorited(false);
    setIsPublic(false);
  }, [result]);

  const handleGenerate = async (condition: IdeaCondition) => {
    setIsLoading(true);
    
    try {
      if (condition.keywords.length === 0 || !condition.target.trim()) {
        alert("キーワードとターゲット層を入力してください。");
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(condition),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'エラーが発生しました。');
      }

      const data = await res.json();
      
      const mappedResult: IdeaResult = {
        name: data.title,
        summary: data.summary,
        targetUser: data.target,
        differentiation: data.differentiation,
        monetization: data.monetization,
        keywords: data.keywords || [],
        feasibilityScore: data.feasibilityScore,
        feasibilityActionPlan: data.feasibilityActionPlan,
      };

      setResult(mappedResult);

      // Auto save
      if (user) {
        setIsSaving(true);
        try {
          const saved = await ideaService.saveIdea({
            user_id: user.uid,
            title: mappedResult.name,
            summary: mappedResult.summary,
            target: mappedResult.targetUser,
            differentiation: mappedResult.differentiation,
            monetization: mappedResult.monetization,
            keywords: mappedResult.keywords,
            feasibilityScore: mappedResult.feasibilityScore,
            feasibilityActionPlan: mappedResult.feasibilityActionPlan,
            conditionData: condition,
            isPublic: false,
          });
          setSavedIdeaId(saved.id);
        } catch (error: any) {
          console.error("Auto save to Firebase failed", error);
        } finally {
          setIsSaving(false);
        }
      } else {
        const saved = ideaService.saveLocalIdea({
          user_id: 'guest',
          title: mappedResult.name,
          summary: mappedResult.summary,
          target: mappedResult.targetUser,
          differentiation: mappedResult.differentiation,
          monetization: mappedResult.monetization,
          keywords: mappedResult.keywords,
          feasibilityScore: mappedResult.feasibilityScore,
          feasibilityActionPlan: mappedResult.feasibilityActionPlan,
          conditionData: condition,
          isPublic: false,
        });
        if (saved) {
          setSavedIdeaId(saved.id);
        }
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || '通信に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user || !savedIdeaId) return;
    try {
      const favoriteState = await ideaService.toggleFavorite(savedIdeaId, user.uid, user.uid);
      setIsFavorited(favoriteState);
    } catch (error: any) {
      console.error(error);
      alert('お気に入りの更新に失敗しました: ' + error.message);
    }
  };

  const handleTogglePublicClick = async () => {
    if (!user || !savedIdeaId || !result) return;
    
    if (isPublic) {
      if (confirm('非公開にしますか？')) {
        try {
          await ideaService.unpublishIdea(savedIdeaId, user.uid);
          setIsPublic(false);
        } catch (error: any) {
          console.error(error);
          alert('非公開の更新に失敗しました: ' + error.message);
        }
      }
    } else {
      // Create a dummy idea object for the modal
      const dummyIdea: Idea = {
        id: savedIdeaId,
        user_id: user.uid,
        title: result.name,
        summary: result.summary,
        target: result.targetUser,
        differentiation: result.differentiation,
        monetization: result.monetization,
        keywords: result.keywords,
        createdAt: new Date().toISOString()
      };
      setPublishModalIdea(dummyIdea);
      setIsPublishModalOpen(true);
    }
  };

  const handlePublishConfirm = async (ideaId: string, tags: string[], commentsEnabled: boolean) => {
    if (!user) return;
    try {
      await ideaService.publishIdea(ideaId, user.uid, tags, commentsEnabled);
      setIsPublic(true);
      setIsPublishModalOpen(false);
      alert('SNSタイムラインに投稿しました！');
    } catch (error: any) {
      console.error(error);
      alert('公開設定の更新に失敗しました: ' + error.message);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-10 mt-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">アイデア作成</h1>
        <p className="text-lg text-gray-600">AIがあなたの条件に合わせて新しいアイデアを提案します</p>
      </header>
      
      <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
      
      <ResultCard 
        result={result} 
        onFavorite={handleFavorite}
        onTogglePublic={handleTogglePublicClick}
        isSaving={isSaving}
        isSaved={!!savedIdeaId}
        isFavorited={isFavorited}
        isPublic={isPublic}
        isAuthenticated={!!user}
      />

      <PublishModal
        idea={publishModalIdea}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublishConfirm}
      />
    </main>
  );
}
