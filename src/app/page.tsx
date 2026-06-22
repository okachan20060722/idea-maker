"use client";

import React, { useState, useEffect } from 'react';
import InputForm from '../components/InputForm';
import ResultCard from '../components/ResultCard';
import { IdeaCondition, IdeaResult } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ideaService } from '../services/ideaService';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [result, setResult] = useState<IdeaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Reset saved states when result changes
  useEffect(() => {
    setSavedIdeaId(null);
    setIsFavorited(false);
  }, [result]);

  const handleGenerate = async (condition: IdeaCondition) => {
    setIsLoading(true);
    
    try {
      if (!condition.keyword.trim() || !condition.target.trim()) {
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
      };

      setResult(mappedResult);
    } catch (error: any) {
      console.error(error);
      alert(error.message || '通信に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      const saved = await ideaService.saveIdea({
        user_id: user.id,
        title: result.name,
        summary: result.summary,
        target: result.targetUser,
        differentiation: result.differentiation,
        monetization: result.monetization,
      });
      setSavedIdeaId(saved.id);
    } catch (error: any) {
      console.error(error);
      alert('保存に失敗しました: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFavorite = async () => {
    if (!user || !savedIdeaId) return;
    try {
      const favoriteState = await ideaService.toggleFavorite(savedIdeaId, user.id);
      setIsFavorited(favoriteState);
    } catch (error: any) {
      console.error(error);
      alert('お気に入りの更新に失敗しました: ' + error.message);
    }
  };

  return (
    <main className="max-w-4xl mx-auto">
      <header className="text-center mb-10 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Idea Maker</h1>
        <p className="text-lg text-gray-600">AIがあなたの条件に合わせて新しいアイデアを提案します</p>
      </header>
      
      <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
      
      <ResultCard 
        result={result} 
        onSave={handleSave}
        onFavorite={handleFavorite}
        isSaving={isSaving}
        isSaved={!!savedIdeaId}
        isFavorited={isFavorited}
        isAuthenticated={!!user}
      />
    </main>
  );
}
