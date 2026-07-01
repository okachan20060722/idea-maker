import React, { useState } from 'react';
import { IdeaCondition } from '../types';

interface InputFormProps {
  onSubmit: (condition: IdeaCondition) => void;
  isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [condition, setCondition] = useState<IdeaCondition>({
    purpose: '個人開発',
    field: 'AI',
    keywords: [],
    target: '',
    grade: '指定なし',
    purposeDetail: '',
    fieldDetail: '',
    advancedConditions: '',
  });

  const [keywords, setKeywords] = useState<string[]>(['', '', '', '']);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCondition(prev => ({ ...prev, [name]: value }));
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredKeywords = keywords.map(k => k.trim()).filter(k => k !== '');
    onSubmit({ ...condition, keywords: filteredKeywords });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="purpose">アイデア作成者</label>
              <select
                id="purpose"
                name="purpose"
                value={condition.purpose}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="学生">学生</option>
                <option value="企業">企業</option>
                <option value="個人開発">個人開発</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {condition.purpose === '学生' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="grade">学年区分</label>
                <select
                  id="grade"
                  name="grade"
                  value={condition.grade}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="指定なし">指定なし</option>
                  <option value="小学生">小学生</option>
                  <option value="中学生">中学生</option>
                  <option value="高校生">高校生</option>
                  <option value="大学生">大学生</option>
                </select>
              </div>
            )}

            {condition.purpose === 'その他' && (
              <div>
                <input
                  type="text"
                  name="purposeDetail"
                  value={condition.purposeDetail}
                  onChange={handleChange}
                  placeholder="詳細を入力してください"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="field">分野</label>
              <select
                id="field"
                name="field"
                value={condition.field}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="教育">教育</option>
                <option value="AI">AI</option>
                <option value="医療">医療</option>
                <option value="エンタメ">エンタメ</option>
                <option value="SNS">SNS</option>
                <option value="環境">環境</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {condition.field === 'その他' && (
              <div>
                <input
                  type="text"
                  name="fieldDetail"
                  value={condition.fieldDetail}
                  onChange={handleChange}
                  placeholder="詳細を入力してください"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">キーワード (任意・最大4つ)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                value={keywords[0]}
                onChange={(e) => handleKeywordChange(0, e.target.value)}
                placeholder="例: リモートワーク"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={keywords[1]}
                onChange={(e) => handleKeywordChange(1, e.target.value)}
                placeholder="例: 筋トレ"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={keywords[2]}
                onChange={(e) => handleKeywordChange(2, e.target.value)}
                placeholder="例: サブスクリプション"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={keywords[3]}
                onChange={(e) => handleKeywordChange(3, e.target.value)}
                placeholder="例: AI活用"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="target">ターゲット層</label>
          <input
            type="text"
            id="target"
            name="target"
            value={condition.target}
            onChange={handleChange}
            placeholder="例: 20代のフリーランス"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center mb-4"
          >
            {showAdvanced ? '▲ 作成条件設定を閉じる' : '▼ 作成条件設定'}
          </button>

          {showAdvanced && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="advancedConditions">AIに学習・考慮してほしい前提条件や制約 (自由記述)</label>
              <textarea
                id="advancedConditions"
                name="advancedConditions"
                value={condition.advancedConditions}
                onChange={handleChange}
                placeholder="例: 予算は10万円以内で実現可能なもの。既存のSaaSツールを組み合わせて開発できるアイデア。英語学習のモチベーション維持に特化した機能を含めること。"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[150px] resize-y"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          disabled={isLoading}
        >
          {isLoading ? '生成中...' : 'アイデアを生成する'}
        </button>
      </form>
    </div>
  );
}
