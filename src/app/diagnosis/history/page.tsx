"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, MessageSquareText, ClipboardList, Trash2, Bookmark, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ideaService, DiagnosisHistory } from '@/services/ideaService';
import { getFirebaseErrorMessage } from '@/lib/firebaseError';
import ConfirmModal from '@/components/ConfirmModal';
import DiagnosisHistoryModal from '@/components/DiagnosisHistoryModal';

export default function DiagnosisHistoryPage() {
  const { user, loading } = useAuth();
  const [historyList, setHistoryList] = useState<DiagnosisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'simple' | 'ai'>('all');

  const [selectedHistory, setSelectedHistory] = useState<DiagnosisHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  useEffect(() => {
    if (loading) return;

    const fetchHistory = async () => {
      try {
        if (user) {
          const list = await ideaService.getDiagnosisHistory(user.uid);
          setHistoryList(list);
        } else {
          const list = ideaService.getLocalDiagnosisHistory();
          setHistoryList(list);
        }
      } catch (error: any) {
        console.error("Failed to fetch history:", error);
        alert(getFirebaseErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user, loading]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ja-JP', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSaveToMypage = async (history: DiagnosisHistory) => {
    try {
      if (user) {
        await ideaService.saveIdea({
          ...history.idea,
          user_id: user.uid,
          isPublic: false
        });
      } else {
        ideaService.saveLocalIdea({
          ...history.idea,
          user_id: 'guest',
          isPublic: false
        });
      }
    } catch (e: any) {
      console.error(e);
      alert('保存に失敗しました: ' + getFirebaseErrorMessage(e));
    }
  };

  const handleDeleteHistory = (historyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    showConfirm(
      '履歴の削除',
      'この診断履歴を削除しますか？\nこの操作は取り消せません。',
      async () => {
        try {
          if (user) {
            await ideaService.deleteDiagnosisHistory(user.uid, historyId);
          } else {
            ideaService.deleteLocalDiagnosisHistory(historyId);
          }
          setHistoryList(prev => prev.filter(h => h.id !== historyId));
          if (selectedHistory?.id === historyId) {
            setIsModalOpen(false);
          }
        } catch (e: any) {
          console.error(e);
          alert('削除に失敗しました: ' + getFirebaseErrorMessage(e));
        }
      },
      true,
      '削除する'
    );
  };

  const filteredList = historyList.filter(h => {
    if (filterTab === 'all') return true;
    return h.type === filterTab;
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/diagnosis" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition mb-4">
          <ArrowLeft size={16} className="mr-1" />
          診断メニューへ戻る
        </Link>
        <div className="flex items-center">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl mr-4">
            <Clock size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">診断履歴</h1>
            <p className="text-gray-500 mt-1">過去に受けた診断結果のログです。気になるアイデアはここから確認できます。</p>
          </div>
        </div>
      </div>

      {!user && historyList.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                現在ゲストとして利用しています。診断履歴はブラウザに一時保存されています。
                <Link href="/login" className="font-bold underline ml-1 hover:text-yellow-800">ログイン</Link>
                すると、履歴や保存したアイデアを永久保存し、どの端末からでも確認できるようになります。
              </p>
            </div>
          </div>
        </div>
      )}

      {historyList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 mb-6">まだ診断履歴がありません。</p>
          <Link href="/diagnosis" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition">
            診断を始める
          </Link>
        </div>
      ) : (
        <>
          <div className="flex space-x-1 border-b border-gray-200 mb-6 w-full overflow-x-auto pb-px">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${filterTab === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              すべて <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{historyList.length}</span>
            </button>
            <button
              onClick={() => setFilterTab('simple')}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${filterTab === 'simple' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              簡易診断 <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{historyList.filter(h => h.type === 'simple').length}</span>
            </button>
            <button
              onClick={() => setFilterTab('ai')}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${filterTab === 'ai' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              AI診断 <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{historyList.filter(h => h.type === 'ai').length}</span>
            </button>
          </div>

          <div className="space-y-6">
            {filteredList.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded-2xl border border-gray-100">
                <p className="text-gray-500">このタブの履歴はありません。</p>
              </div>
            ) : (
              filteredList.map((history) => (
                <div 
                  key={history.id} 
                  onClick={() => {
                    setSelectedHistory(history);
                    setIsModalOpen(true);
                  }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row justify-between items-start sm:items-center"
                >
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className={`p-3 rounded-xl mr-4 flex-shrink-0 transition-colors ${history.type === 'ai' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-100'}`}>
                      {history.type === 'ai' ? <MessageSquareText size={24} /> : <ClipboardList size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {history.type === 'ai' ? 'AI診断' : '簡易診断'}
                        </span>
                        <span className="text-xs text-gray-400">&bull;</span>
                        <span className="text-xs text-gray-400">{formatDate(history.createdAt)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {history.idea.keywords && history.idea.keywords.length > 0 
                          ? history.idea.keywords.join(' × ') 
                          : history.idea.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{history.idea.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToMypage(history);
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                      title="マイページに保存"
                    >
                      <Bookmark size={20} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteHistory(history.id, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                      title="履歴を削除"
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className="p-2 text-gray-300 group-hover:text-indigo-500 transition ml-2">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <DiagnosisHistoryModal
        history={selectedHistory}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveToMypage={handleSaveToMypage}
        onDeleteHistory={(id) => handleDeleteHistory(id)}
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
    </main>
  );
}
