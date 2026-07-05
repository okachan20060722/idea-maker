import React from 'react';
import { DiagnosisHistory } from '@/services/ideaService';
import { X, Bookmark, Trash2, Rocket, ArrowRight } from 'lucide-react';

interface DiagnosisHistoryModalProps {
  history: DiagnosisHistory | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveToMypage: (history: DiagnosisHistory) => void;
  onDeleteHistory: (historyId: string) => void;
}

export default function DiagnosisHistoryModal({
  history,
  isOpen,
  onClose,
  onSaveToMypage,
  onDeleteHistory
}: DiagnosisHistoryModalProps) {
  const [isSaved, setIsSaved] = React.useState(false);

  // Reset isSaved when a different history item is opened
  React.useEffect(() => {
    setIsSaved(false);
  }, [history?.id]);

  if (!isOpen || !history) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 animate-fade-in flex flex-col">
        {/* Header Actions */}
        <div className="sticky top-0 right-0 z-20 flex justify-end p-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
          <div className="pointer-events-auto flex space-x-2">
            <button
              onClick={() => {
                if (!isSaved) {
                  onSaveToMypage(history);
                  setIsSaved(true);
                }
              }}
              className={`p-2 rounded-full transition backdrop-blur-md ${isSaved ? 'bg-blue-500 text-white' : 'bg-white/20 hover:bg-white/40 text-white'}`}
              title={isSaved ? "保存済み" : "マイページに保存"}
            >
              <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => {
                onDeleteHistory(history.id);
              }}
              className="p-2 bg-white/20 hover:bg-red-500/80 text-white rounded-full transition backdrop-blur-md"
              title="履歴を削除"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition backdrop-blur-md"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top Gradient Block */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-8 sm:p-12 text-white -mt-16">
          <div className="mt-12 text-center max-w-3xl mx-auto">
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-md">
              {history.type === 'ai' ? 'AI診断結果' : '簡易診断結果'}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8 leading-tight flex justify-center items-center flex-wrap gap-3 drop-shadow-lg">
              <span role="img" aria-label="sparkles" className="text-yellow-300">✨</span>
              {history.idea.keywords && history.idea.keywords.length > 0 
                ? history.idea.keywords.join(' × ') 
                : history.idea.title}
            </h1>
            
            <div className="bg-white/10 p-6 sm:p-8 rounded-2xl text-left backdrop-blur-md border border-white/20 shadow-inner">
              <h3 className="text-sm font-bold text-indigo-200 mb-3 flex items-center">
                <ArrowRight size={16} className="mr-2" />
                AIからの分析コメント
              </h3>
              <p className="text-lg leading-relaxed text-white font-medium">
                {history.diagnosisText}
              </p>
            </div>
          </div>
        </div>

        {/* Idea Details */}
        <div className="p-8 sm:p-12 bg-gray-50 flex-grow">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">💡</span>
              提案されたアイデア
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{history.idea.title}</h3>
                <p className="text-gray-700 leading-relaxed">{history.idea.summary}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
                <div className="bg-white p-6">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block mb-2">想定ターゲット</span>
                  <p className="text-gray-800">{history.idea.target}</p>
                </div>
                <div className="bg-white p-6">
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block mb-2">差別化ポイント</span>
                  <p className="text-gray-800">{history.idea.differentiation}</p>
                </div>
              </div>
              
              <div className="p-6 bg-blue-50/50 border-t border-gray-100">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">収益化案</span>
                <p className="text-gray-800">{history.idea.monetization}</p>
              </div>
            </div>

            {/* Feasibility Score (if available) */}
            {history.idea.feasibilityScore !== undefined && history.idea.feasibilityActionPlan && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 sm:p-8 rounded-2xl border border-indigo-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Rocket className="text-indigo-500 mr-3" size={24} />
                  実現性スコアと詳細解説
                </h3>
                
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mr-5 text-center min-w-[100px]">
                    <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">スコア</span>
                    <span className="block text-3xl font-extrabold text-indigo-700">
                      {history.idea.feasibilityScore}<span className="text-xl text-indigo-400 ml-1">%</span>
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-4 border border-indigo-100 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full ${history.idea.feasibilityScore >= 80 ? 'bg-green-500' : history.idea.feasibilityScore >= 50 ? 'bg-indigo-500' : 'bg-yellow-500'} transition-all duration-1000 ease-out`}
                      style={{ width: `${history.idea.feasibilityScore}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-50">
                  <h4 className="text-sm font-bold text-indigo-800 mb-3 border-b border-indigo-50 pb-2">スコアの理由と実現への具体案</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{history.idea.feasibilityActionPlan}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
