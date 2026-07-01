"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Sparkles, Save, Heart } from 'lucide-react';
import { IdeaResult } from '@/types';
import ResultCard from '@/components/ResultCard';
import { useAuth } from '@/hooks/useAuth';
import { ideaService } from '@/services/ideaService';

const questions = [
  {
    id: 1,
    text: "あなたの現在の興味・関心はどれに一番近いですか？",
    options: [
      "テクノロジー・IT・AI",
      "ライフスタイル・健康・美容",
      "教育・スキルアップ",
      "エンタメ・アート・クリエイティブ",
      "地域課題・社会貢献"
    ]
  },
  {
    id: 2,
    text: "何かアイデアを実行する際、どのリソースを最も使えますか？",
    options: [
      "専門的なスキル（プログラミング、デザイン等）",
      "コミュニケーション力や人脈",
      "資金力",
      "時間と体力"
    ]
  },
  {
    id: 3,
    text: "どのようなターゲット層に向けたサービスを作りたいですか？",
    options: [
      "学生・若年層",
      "ビジネスパーソン・企業（B2B）",
      "主婦・ファミリー層",
      "シニア層",
      "クリエイター・専門家"
    ]
  },
  {
    id: 4,
    text: "サービスの提供形態として理想的なものはどれですか？",
    options: [
      "Webアプリ・スマホアプリ",
      "コンサルティング・オンラインサロン等（人ベース）",
      "物理的な商品（EC、店舗等）",
      "メディア・コンテンツ配信"
    ]
  },
  {
    id: 5,
    text: "アイデアを通じて一番達成したい目標は何ですか？",
    options: [
      "大きな収益を得たい",
      "自分のスキルを試したい・向上させたい",
      "困っている人を助けたい",
      "新しいトレンドを作りたい"
    ]
  }
];

export default function SimpleDiagnosis() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [result, setResult] = useState<{diagnosis: string, idea: IdeaResult} | null>(null);
  const { user } = useAuth();
  
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handleSelect = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = option;
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      submitDiagnosis(newAnswers);
    }
  };

  const submitDiagnosis = async (finalAnswers: string[]) => {
    setIsDiagnosing(true);
    setSavedIdeaId(null);
    setIsFavorited(false);
    
    try {
      const payload = questions.map((q, i) => ({
        question: q.text,
        answer: finalAnswers[i]
      }));

      const res = await fetch('/api/diagnose/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: payload }),
      });

      if (!res.ok) {
        throw new Error('診断に失敗しました');
      }

      const data = await res.json();
      const mappedIdea: IdeaResult = {
        name: data.idea.title,
        summary: data.idea.summary,
        targetUser: data.idea.target,
        differentiation: data.idea.differentiation,
        monetization: data.idea.monetization,
        keywords: data.idea.keywords || [],
      };
      
      setResult({
        diagnosis: data.diagnosis,
        idea: mappedIdea
      });

      // Auto save
      if (user) {
        setIsSaving(true);
        try {
          const saved = await ideaService.saveIdea({
            user_id: user.uid,
            title: mappedIdea.name,
            summary: mappedIdea.summary,
            target: mappedIdea.targetUser,
            differentiation: mappedIdea.differentiation,
            monetization: mappedIdea.monetization,
            keywords: mappedIdea.keywords,
            isPublic: false,
          });
          setSavedIdeaId(saved.id);
        } catch (error) {
          console.error("Auto save failed", error);
        } finally {
          setIsSaving(false);
        }
      } else {
        const saved = ideaService.saveLocalIdea({
          user_id: 'guest',
          title: mappedIdea.name,
          summary: mappedIdea.summary,
          target: mappedIdea.targetUser,
          differentiation: mappedIdea.differentiation,
          monetization: mappedIdea.monetization,
          keywords: mappedIdea.keywords,
          isPublic: false,
        });
        if (saved) setSavedIdeaId(saved.id);
      }
      
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。もう一度お試しください。');
      setCurrentStep(0);
      setAnswers([]);
    } finally {
      setIsDiagnosing(false);
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

  if (result) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/diagnosis" className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-6 font-medium">
          <ArrowLeft size={16} className="mr-1" />
          診断メニューへ戻る
        </Link>
        
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-4 flex items-center">
            <Sparkles className="mr-3" />
            診断結果
          </h1>
          <p className="text-lg leading-relaxed">{result.diagnosis}</p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">あなたへのおすすめアイデア</h2>
        <ResultCard 
          result={result.idea} 
          onFavorite={handleFavorite}
          isSaving={isSaving}
          isSaved={!!savedIdeaId}
          isFavorited={isFavorited}
          isAuthenticated={!!user}
        />
        
        <div className="mt-8 text-center flex justify-center space-x-4">
          <button 
            onClick={() => {
              setResult(null);
              setCurrentStep(0);
              setAnswers([]);
            }}
            className="px-6 py-3 bg-white text-gray-700 font-medium rounded-full shadow border border-gray-200 hover:bg-gray-50 transition"
          >
            もう一度診断する
          </button>
          <Link href="/ideas" className="px-6 py-3 bg-teal-600 text-white font-medium rounded-full shadow hover:bg-teal-700 transition">
            保存されたアイデアを見る
          </Link>
        </div>
      </main>
    );
  }

  if (isDiagnosing) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 mb-8 relative">
          <div className="absolute inset-0 rounded-full border-4 border-teal-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">診断中...</h2>
        <p className="text-gray-500">あなたの回答から最適な方向性を分析しています</p>
      </main>
    );
  }

  const question = questions[currentStep];

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/diagnosis" className="inline-flex items-center text-gray-500 hover:text-gray-800 mb-8 font-medium transition">
        <ArrowLeft size={16} className="mr-1" />
        戻る
      </Link>

      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span>質問 {currentStep + 1} / {questions.length}</span>
          <span>{Math.round(((currentStep) / questions.length) * 100)}% 完了</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div 
            className="bg-teal-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${((currentStep) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 leading-tight">
          {question.text}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group
                ${answers[currentStep] === option 
                  ? 'border-teal-500 bg-teal-50 text-teal-800' 
                  : 'border-gray-100 hover:border-teal-200 hover:bg-gray-50 text-gray-700'
                }`}
            >
              <span className="font-medium text-lg">{option}</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors
                ${answers[currentStep] === option ? 'bg-teal-500 text-white' : 'bg-gray-100 text-transparent group-hover:bg-teal-100 group-hover:text-teal-300'}`}>
                <CheckCircle2 size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
