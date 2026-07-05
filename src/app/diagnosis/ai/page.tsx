"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles, User, Lightbulb, RefreshCw } from 'lucide-react';
import { IdeaResult } from '@/types';
import ResultCard from '@/components/ResultCard';
import { useAuth } from '@/hooks/useAuth';
import { ideaService } from '@/services/ideaService';
import { getFirebaseErrorMessage } from '@/lib/firebaseError';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

type InputMode = 'text' | 'buttons' | 'diagnosis' | 'loading';

export default function AIDiagnosis() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'ai',
      content: 'こんにちは！あなたにぴったりのアイデアを見つけるために、AIがいくつか質問をさせていただきます。まず、今あなたが一番興味を持っていることや、得意な分野・スキルがあれば教えてください。'
    }
  ]);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Generate a unique session ID on mount
    setSessionId(Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
  }, []);

  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [result, setResult] = useState<{ diagnosis: string, idea: IdeaResult } | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const [maxQuestions, setMaxQuestions] = useState(4);
  const [questionCount, setQuestionCount] = useState(1);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [aiOptions, setAiOptions] = useState<string[]>([]);

  const { user } = useAuth();
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, inputMode, result]);

  const handleSendText = async (textToUse?: string) => {
    const text = typeof textToUse === 'string' ? textToUse : inputValue;
    if (!text.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim()
    };

    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setInputValue('');
    setAiOptions([]);

    if (questionCount >= maxQuestions) {
      setAnsweredCount(prev => Math.max(prev, maxQuestions));
      setInputMode('buttons');
    } else {
      setInputMode('loading');
      await fetchNextQuestion(newMessages);
    }
  };

  const handleOptionClick = (option: string) => {
    handleSendText(option);
  };

  const fetchNextQuestion = async (currentMessages: Message[]) => {
    try {
      const res = await fetchWithRetry('/api/diagnose/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          action: 'next_question',
          sessionId
        }),
      });

      if (!res.ok) throw new Error('API通信に失敗しました');

      const data = await res.json();

      let newOptions: string[] = [];
      if (data.isAmbiguous) {
        if (data.options && data.options.length > 0) {
          newOptions = data.options;
        }
      } else {
        setQuestionCount(prev => prev + 1);
        setAnsweredCount(prev => prev + 1);
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: data.reply }]);
      setAiOptions(newOptions);
      setInputMode('text');

    } catch (error: any) {
      console.error(error);
      alert(getFirebaseErrorMessage(error));
      setInputMode('text');
    }
  };

  const handleManualNextQuestion = () => {
    setInputMode('loading');
    fetchNextQuestion(messages);
  };

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    try {
      const res = await fetchWithRetry('/api/diagnose/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          action: 'diagnose',
          sessionId
        }),
      });

      if (!res.ok) throw new Error('診断に失敗しました');

      const data = await res.json();

      const mappedIdea: IdeaResult = {
        name: data.idea.title,
        summary: data.idea.summary,
        targetUser: data.idea.target,
        differentiation: data.idea.differentiation,
        monetization: data.idea.monetization,
        keywords: data.idea.keywords || [],
        feasibilityScore: data.idea.feasibilityScore,
        feasibilityActionPlan: data.idea.feasibilityActionPlan,
      };

      setResult({
        diagnosis: data.diagnosis,
        idea: mappedIdea
      });
      setInputMode('diagnosis');

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Auto save to history
      if (user) {
        try {
          await ideaService.saveDiagnosisHistory({
            user_id: user.uid,
            type: 'ai',
            diagnosisText: data.diagnosis,
            idea: {
              user_id: user.uid,
              title: mappedIdea.name,
              summary: mappedIdea.summary,
              target: mappedIdea.targetUser,
              differentiation: mappedIdea.differentiation,
              monetization: mappedIdea.monetization,
              keywords: mappedIdea.keywords,
              feasibilityScore: mappedIdea.feasibilityScore,
              feasibilityActionPlan: mappedIdea.feasibilityActionPlan,
            }
          });
        } catch (error: any) {
          console.error("Auto save history failed", error);
        }
      } else {
        ideaService.saveLocalDiagnosisHistory({
          user_id: 'guest',
          type: 'ai',
          diagnosisText: data.diagnosis,
          idea: {
            user_id: 'guest',
            title: mappedIdea.name,
            summary: mappedIdea.summary,
            target: mappedIdea.targetUser,
            differentiation: mappedIdea.differentiation,
            monetization: mappedIdea.monetization,
            keywords: mappedIdea.keywords,
            feasibilityScore: mappedIdea.feasibilityScore,
            feasibilityActionPlan: mappedIdea.feasibilityActionPlan,
          }
        });
      }

    } catch (error: any) {
      console.error(error);
      alert('エラーが発生しました: ' + getFirebaseErrorMessage(error));
      setInputMode('buttons');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleToggleSave = async () => {
    if (!result) return;
    if (savedIdeaId) {
      // Unsave
      setIsSaving(true);
      try {
        if (user) {
          await ideaService.deleteIdea(savedIdeaId, user.uid);
        } else {
          ideaService.deleteLocalIdea(savedIdeaId);
        }
        setSavedIdeaId('');
      } catch (error) {
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Save
      setIsSaving(true);
      try {
        if (user) {
          const saved = await ideaService.saveIdea({
            user_id: user.uid,
            title: result.idea.name,
            summary: result.idea.summary,
            target: result.idea.targetUser,
            differentiation: result.idea.differentiation,
            monetization: result.idea.monetization,
            keywords: result.idea.keywords,
            feasibilityScore: result.idea.feasibilityScore,
            feasibilityActionPlan: result.idea.feasibilityActionPlan,
            isPublic: false,
          });
          setSavedIdeaId(saved.id);
        } else {
          const saved = ideaService.saveLocalIdea({
            user_id: 'guest',
            title: result.idea.name,
            summary: result.idea.summary,
            target: result.idea.targetUser,
            differentiation: result.idea.differentiation,
            monetization: result.idea.monetization,
            keywords: result.idea.keywords,
            feasibilityScore: result.idea.feasibilityScore,
            feasibilityActionPlan: result.idea.feasibilityActionPlan,
            isPublic: false,
          });
          if (saved) setSavedIdeaId(saved.id);
        }
      } catch (error: any) {
        console.error(error);
        alert('保存に失敗しました: ' + getFirebaseErrorMessage(error));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const progressPercentage = Math.min((answeredCount / maxQuestions) * 100, 100);

  if (isDiagnosing) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="flex space-x-3 mb-8">
          <div className="w-5 h-5 bg-indigo-400 rounded-full animate-bounce"></div>
          <div className="w-5 h-5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
          <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 animate-pulse">AIがあなたに最適なアイデアを分析中...</h2>
        <p className="text-gray-500">これまでの回答をもとに、実現性の高いプランを構築しています</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <Link href="/diagnosis" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition">
          <ArrowLeft size={16} className="mr-1" />
          診断メニューへ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">AI診断チャット</h1>

        {/* Progress bar */}
        {inputMode !== 'diagnosis' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
              <span>診断進捗</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Conditional Rendering: Chat Area vs Result Area */}
        {inputMode !== 'diagnosis' && !result ? (
          <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 ml-3' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white mr-3 shadow-md'}`}>
                    {msg.role === 'user' ? <User size={20} /> : <Lightbulb size={20} />}
                  </div>
                  <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {inputMode === 'loading' && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] flex-row">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white mr-3 shadow-md">
                    <Lightbulb size={20} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-6 bg-gray-50/50">
            {result && (
              <div className="pt-2" ref={resultRef}>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg text-center">
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-6 flex justify-center items-center flex-wrap gap-2">
                    <Sparkles className="mr-2" size={32} />
                    {result.idea.keywords && result.idea.keywords.length > 0 ? result.idea.keywords.join(' × ') : 'AI診断結果'}
                  </h1>
                  <div className="bg-white/10 p-6 rounded-xl text-left backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-indigo-200 mb-2 uppercase tracking-wider">AIからの分析コメント</h3>
                    <p className="text-lg leading-relaxed text-white">{result.diagnosis}</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">おすすめのアイデア</h2>
                <ResultCard
                  result={result.idea}
                  onSave={handleToggleSave}
                  onToggleSave={handleToggleSave}
                  isSaving={isSaving}
                  isSaved={!!savedIdeaId}
                  isAuthenticated={!!user}
                />

                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 flex-wrap">
                  <Link href="/diagnosis" className="px-6 py-3 bg-white text-gray-700 font-medium rounded-full shadow border border-gray-200 hover:bg-gray-50 transition inline-flex items-center justify-center">
                    診断メニューへ
                  </Link>
                  <button
                    onClick={() => {
                      setResult(null);
                      setInputMode('buttons');
                      setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="px-6 py-3 bg-indigo-50 text-indigo-700 font-medium rounded-full shadow border border-indigo-100 hover:bg-indigo-100 transition inline-flex items-center justify-center"
                  >
                    <Lightbulb size={18} className="mr-2" />
                    もう少し回答する
                  </button>
                  <button
                    onClick={() => {
                      setMessages([{
                        id: 'init',
                        role: 'ai',
                        content: 'こんにちは！あなたにぴったりのアイデアを見つけるために、AIがいくつか質問をさせていただきます。まず、今あなたが一番興味を持っていることや、得意な分野・スキルがあれば教えてください。'
                      }]);
                      setResult(null);
                      setSavedIdeaId(null);
                      setQuestionCount(1);
                      setAnsweredCount(0);
                      setMaxQuestions(4);
                      setAiOptions([]);
                      setInputMode('text');
                      setSessionId(Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
                    }}
                    className="px-6 py-3 bg-white text-gray-700 font-medium rounded-full shadow border border-gray-200 hover:bg-gray-100 transition inline-flex items-center justify-center"
                  >
                    <RefreshCw size={18} className="mr-2" />
                    最初からやり直す
                  </button>
                  <Link href="/diagnosis/history" className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-full shadow hover:opacity-90 transition inline-flex items-center justify-center">
                    診断履歴
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        {inputMode !== 'diagnosis' && (
          <div className="p-4 bg-white border-t border-gray-100">
            {inputMode === 'buttons' && (
              <div className="flex flex-col md:flex-row gap-3 justify-center mb-2 animate-fade-in">
                <button
                  onClick={handleDiagnose}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  <Sparkles size={18} className="mr-2" />
                  診断結果を見る
                </button>
                <button
                  onClick={handleManualNextQuestion}
                  className="px-6 py-3 bg-indigo-50 text-indigo-700 font-medium rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center"
                >
                  <Lightbulb size={18} className="mr-2" />
                  続けて質問に答える
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className="px-6 py-3 bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition-all flex items-center justify-center"
                >
                  <User size={18} className="mr-2" />
                  追加情報を入力する
                </button>
              </div>
            )}

            {inputMode === 'text' && (
              <div className="flex flex-col gap-3">
                {aiOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-start mb-1">
                    {aiOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(opt)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendText();
                      }
                    }}
                    placeholder="回答や要望を入力してください..."
                    className="flex-grow bg-transparent border-none focus:ring-0 resize-none max-h-32 p-3 text-gray-800"
                    rows={2}
                  />
                  <button
                    onClick={() => handleSendText()}
                    disabled={!inputValue.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1 mr-1"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            )}

            {inputMode === 'text' && (
              <p className="text-xs text-gray-400 mt-2 text-center">Shift + Enterで改行できます</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
