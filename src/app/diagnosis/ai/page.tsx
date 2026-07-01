"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles, User, Bot, RefreshCw } from 'lucide-react';
import { IdeaResult } from '@/types';
import ResultCard from '@/components/ResultCard';
import { useAuth } from '@/hooks/useAuth';
import { ideaService } from '@/services/ideaService';

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
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [result, setResult] = useState<{diagnosis: string, idea: IdeaResult} | null>(null);
  
  const { user } = useAuth();
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, inputMode, result]);

  const handleSendText = () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setInputMode('buttons');
  };

  const handleNextQuestion = async () => {
    setInputMode('loading');
    try {
      const res = await fetch('/api/diagnose/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          action: 'next_question' 
        }),
      });

      if (!res.ok) throw new Error('API通信に失敗しました');

      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: data.reply }]);
      setInputMode('text');
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました。もう一度お試しください。');
      setInputMode('buttons');
    }
  };

  const handleDiagnose = async () => {
    setInputMode('loading');
    try {
      const res = await fetch('/api/diagnose/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          action: 'diagnose' 
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
      };
      
      setResult({
        diagnosis: data.diagnosis,
        idea: mappedIdea
      });
      setInputMode('diagnosis');

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
      setInputMode('buttons');
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

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <Link href="/diagnosis" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition">
          <ArrowLeft size={16} className="mr-1" />
          診断メニューへ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">AI診断チャット</h1>
      </div>

      <div className="flex-grow bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 ml-3' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white mr-3 shadow-md'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
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
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          
          {result && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <Sparkles className="mr-3" />
                  AI診断結果
                </h2>
                <p className="text-lg leading-relaxed">{result.diagnosis}</p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">おすすめのアイデア</h2>
              <ResultCard 
                result={result.idea} 
                onFavorite={handleFavorite}
                isSaving={isSaving}
                isSaved={!!savedIdeaId}
                isFavorited={isFavorited}
                isAuthenticated={!!user}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

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
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-indigo-50 text-indigo-700 font-medium rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center"
                >
                  <Bot size={18} className="mr-2" />
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
                  onClick={handleSendText}
                  disabled={!inputValue.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1 mr-1"
                >
                  <Send size={20} />
                </button>
              </div>
            )}
            
            {inputMode === 'text' && (
               <p className="text-xs text-gray-400 mt-2 text-center">Shift + Enterで改行できます</p>
            )}
          </div>
        )}
        
        {inputMode === 'diagnosis' && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
            <button
              onClick={() => {
                setMessages([{
                  id: 'init',
                  role: 'ai',
                  content: 'こんにちは！あなたにぴったりのアイデアを見つけるために、AIがいくつか質問をさせていただきます。まず、今あなたが一番興味を持っていることや、得意な分野・スキルがあれば教えてください。'
                }]);
                setResult(null);
                setInputMode('text');
              }}
              className="px-6 py-3 bg-white text-gray-700 font-medium rounded-full shadow border border-gray-200 hover:bg-gray-100 transition inline-flex items-center"
            >
              <RefreshCw size={18} className="mr-2" />
              最初からやり直す
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
