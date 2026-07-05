import Link from 'next/link';
import { ClipboardList, MessageSquareText, Compass, History } from 'lucide-react';

export default function DiagnosisDashboard() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12 text-center">
      <header className="mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-teal-50 rounded-full mb-6 text-teal-600 shadow-sm">
          <Compass size={40} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">方向性診断</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          あなたに最適なアイデアの方向性を見つけるための2つの診断コースをご用意しています。
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="group text-left bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-teal-200 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex-grow flex flex-col">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <ClipboardList size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">簡易診断</h2>
            <p className="text-gray-600 mb-6 flex-grow">
              いくつかの簡単な質問に選択式で答えるだけで、すぐにおすすめの方向性がわかります。
            </p>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
              <Link href="/diagnosis/simple" className="text-teal-600 font-semibold flex items-center hover:text-teal-700 transition-colors">
                診断を始める <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link href="/diagnosis/history" className="text-gray-500 hover:text-teal-600 flex items-center text-sm font-medium transition-colors bg-gray-50 hover:bg-teal-50 px-3 py-1.5 rounded-full">
                <History size={16} className="mr-1" />
                履歴
              </Link>
            </div>
          </div>
        </div>

        <div className="group text-left bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex-grow flex flex-col">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <MessageSquareText size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">AI診断</h2>
            <p className="text-gray-600 mb-6 flex-grow">
              AIとチャット形式で対話しながら、より深くあなたの強みや希望を掘り下げて診断します。
            </p>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
              <Link href="/diagnosis/ai" className="text-indigo-600 font-semibold flex items-center hover:text-indigo-700 transition-colors">
                AIと対話する <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link href="/diagnosis/history" className="text-gray-500 hover:text-indigo-600 flex items-center text-sm font-medium transition-colors bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-full">
                <History size={16} className="mr-1" />
                履歴
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
