import Link from 'next/link';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-8 flex flex-col items-center justify-center">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight mb-4 drop-shadow-sm">
          Idea Maker
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          あなたのアイデアを形にするためのプラットフォーム
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* 方向性診断 */}
        <Link href="/diagnosis" className="group">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl p-8 h-full border border-white/20 shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:bg-white dark:group-hover:bg-gray-800">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-6 shadow-lg text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">方向性診断</h2>
            <p className="text-gray-600 dark:text-gray-300">
              いくつかの質問に答えるだけで、あなたが次に考えるべきアイデアの方向性を診断します。
            </p>
          </div>
        </Link>

        {/* アイデア作成 */}
        <Link href="/create" className="group">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl p-8 h-full border border-white/20 shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:bg-white dark:group-hover:bg-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg text-white relative z-10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 relative z-10">アイデア作成</h2>
            <p className="text-gray-600 dark:text-gray-300 relative z-10">
              ターゲットやキーワードを入力し、AIの力で新しいアイデアを自動生成します。
            </p>
          </div>
        </Link>

        {/* アイデア一覧 */}
        <Link href="/ideas" className="group">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl p-8 h-full border border-white/20 shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:bg-white dark:group-hover:bg-gray-800">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">アイデア一覧</h2>
            <p className="text-gray-600 dark:text-gray-300">
              これまでに作成・保存したアイデアを振り返り、さらに深掘りや編集を行います。
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}
