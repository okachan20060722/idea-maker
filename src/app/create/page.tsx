"use client";

import React, { useState, useEffect } from 'react';
import InputForm from '@/components/InputForm';
import ResultCard from '@/components/ResultCard';
import PublishModal from '@/components/PublishModal';
import ConfirmModal from '@/components/ConfirmModal';
import BackToTopButton from '@/components/BackToTopButton';
import { IdeaCondition, IdeaResult } from '@/types';
import { ideaService, Idea } from '@/services/ideaService';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getFirebaseErrorMessage } from '@/lib/firebaseError';

export default function CreateIdea() {
  const router = useRouter();
  const [result, setResult] = useState<IdeaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const resultRef = React.useRef<HTMLDivElement>(null);
  
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  const [publishModalIdea, setPublishModalIdea] = useState<Idea | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false, confirmText = 'OK') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDestructive,
      confirmText
    });
  };
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
  }, []);

  useEffect(() => {
    setSavedIdeaId(null);
    setIsPublic(false);
    setIsFavorited(false);
  }, [result]);

  const autoSaveIdea = async (ideaResult: IdeaResult) => {
    setIsSaving(true);
    try {
      if (user) {
        const saved = await ideaService.saveIdea({
          user_id: user.uid,
          title: ideaResult.name,
          summary: ideaResult.summary,
          target: ideaResult.targetUser,
          differentiation: ideaResult.differentiation,
          monetization: ideaResult.monetization,
          keywords: ideaResult.keywords,
          feasibilityScore: ideaResult.feasibilityScore,
          feasibilityActionPlan: ideaResult.feasibilityActionPlan,
          isPublic: false,
        });
        setSavedIdeaId(saved.id);
      } else {
        const saved = ideaService.saveLocalIdea({
          user_id: 'guest',
          title: ideaResult.name,
          summary: ideaResult.summary,
          target: ideaResult.targetUser,
          differentiation: ideaResult.differentiation,
          monetization: ideaResult.monetization,
          keywords: ideaResult.keywords,
          feasibilityScore: ideaResult.feasibilityScore,
          feasibilityActionPlan: ideaResult.feasibilityActionPlan,
          isPublic: false,
        });
        if (saved) {
          setSavedIdeaId(saved.id);
        }
      }
    } catch (error: any) {
      console.error(error);
      // Auto save error can be silent or alert
    } finally {
      setIsSaving(false);
    }
  };

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
        body: JSON.stringify({ ...condition, sessionId }),
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
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Automatically save the generated idea
      autoSaveIdea(mappedResult);

    } catch (error: any) {
      console.error(error);
      alert(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (loading) return;
    
    if (!user) {
      const expectedNewStatus = !isFavorited;
      
      let targetId = savedIdeaId;
      if (!targetId && result) {
        // Automatically save it locally if not saved yet
        const mappedResult = {
          user_id: 'guest',
          title: result.name,
          summary: result.summary,
          target: result.targetUser,
          differentiation: result.differentiation,
          monetization: result.monetization,
          keywords: result.keywords || [],
          isPublic: false,
          feasibilityScore: result.feasibilityScore,
          feasibilityActionPlan: result.feasibilityActionPlan
        };
        const saved = ideaService.saveLocalIdea(mappedResult);
        if (saved) {
          targetId = saved.id;
          setSavedIdeaId(saved.id);
        }
      }

      if (targetId && result) {
        const ideaToToggle: Idea = {
          id: targetId,
          user_id: 'guest',
          title: result.name,
          summary: result.summary,
          target: result.targetUser,
          differentiation: result.differentiation,
          monetization: result.monetization,
          keywords: result.keywords || [],
          feasibilityScore: result.feasibilityScore,
          feasibilityActionPlan: result.feasibilityActionPlan,
          isPublic: false,
          favoritedBy: expectedNewStatus ? ['guest'] : [],
          likedBy: [],
          likesCount: 0,
          createdAt: new Date().toISOString()
        };
        ideaService.toggleLocalFavorite(ideaToToggle);
        setIsFavorited(expectedNewStatus);
      }
      return;
    }
    
    if (!savedIdeaId) return;

    const expectedNewStatus = !isFavorited;
    setIsFavorited(expectedNewStatus);

    try {
      if (savedIdeaId.startsWith('local_')) {
        // Idea was saved locally before login migration
        console.warn("Cannot favorite local idea on server before migration");
        return;
      }
      await ideaService.toggleFavorite(savedIdeaId, user.uid, user.uid);
    } catch (error: any) {
      console.error('Toggle favorite failed:', error);
      setIsFavorited(!expectedNewStatus); // Revert on failure
    }
  };

  const handleTogglePublicClick = async () => {
    if (!user) {
      showConfirm(
        'ログインが必要です',
        'SNSへの投稿にはログインが必要です。ログイン画面へ移動しますか？',
        () => router.push('/login'),
        false,
        'ログインする'
      );
      return;
    }
    if (!savedIdeaId || !result) return;
    
    if (isPublic) {
      showConfirm(
        '非公開にする',
        '本当にこのアイデアを非公開にしますか？',
        async () => {
          try {
            await ideaService.unpublishIdea(savedIdeaId, user.uid);
            setIsPublic(false);
          } catch (error: any) {
            console.error(error);
            alert('非公開の更新に失敗しました: ' + getFirebaseErrorMessage(error));
          }
        },
        true,
        '非公開にする'
      );
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
    if (!user || !publishModalIdea) return;
    try {
      let finalIdeaId = ideaId;

      // Migrate local idea to Firestore if needed
      if (ideaId.startsWith('local_')) {
        const ideaToSave = { ...publishModalIdea, user_id: user.uid, isPublic: true, tags, commentsEnabled };
        delete (ideaToSave as any).id;
        delete (ideaToSave as any).isFavorite;
        
        const saved = await ideaService.saveIdea(ideaToSave);
        finalIdeaId = saved.id;
        setSavedIdeaId(finalIdeaId);
      } else {
        await ideaService.publishIdea(finalIdeaId, user.uid, tags, commentsEnabled);
      }

      const updatedIdea = { ...publishModalIdea, id: finalIdeaId, isPublic: true, tags, commentsEnabled, user_id: user.uid };
      setPublishModalIdea(updatedIdea);
      setIsPublic(true);
      setIsPublishModalOpen(false);
      
      showConfirm(
        '公開完了',
        'アイデアをタイムラインに公開しました！',
        () => router.push('/timeline'),
        false,
        'タイムラインを見る'
      );
    } catch (error: any) {
      console.error(error);
      showConfirm(
        'エラー',
        '公開に失敗しました: ' + getFirebaseErrorMessage(error),
        () => {},
        false,
        '閉じる'
      );
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-10 mt-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">アイデア作成</h1>
        <p className="text-lg text-gray-600">AIがあなたの条件に合わせて新しいアイデアを提案します</p>
      </header>
      
      <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
      
      <div ref={resultRef}>
        <ResultCard 
          result={result} 
          onTogglePublic={handleTogglePublicClick}
          onToggleFavorite={handleToggleFavorite}
          isSaving={isSaving}
          isSaved={!!savedIdeaId}
          isPublic={isPublic}
          isFavorited={isFavorited}
          autoSaved={true}
          isAuthenticated={true} // Set true to show buttons even for guests (we alert them if clicked)
        />
      </div>

      <PublishModal
        idea={publishModalIdea}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublishConfirm}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        isDestructive={confirmConfig.isDestructive}
        confirmText={confirmConfig.confirmText}
      />

      <BackToTopButton />
    </main>
  );
}
