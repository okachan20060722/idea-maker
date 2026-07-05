import { NextResponse } from 'next/server';
import { Type, Schema } from '@google/genai';
import { generateContentWithRotation } from '@/lib/geminiRotation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, action, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'チャット履歴が必要です。' }, { status: 400 });
    }



    // フォーマットチャット履歴
    const formattedHistory = messages.map((m: any) => `${m.role === 'ai' ? 'AI' : 'ユーザー'}: ${m.content}`).join('\n\n');

    if (action === 'next_question') {
      const prompt = `あなたは「起業・副業アイデアの方向性診断AI」です。
ユーザーから起業・副業に関する「ターゲット、課題、テーマ、規模」の4つの要素を聞き出すための対話を行います。

以下のユーザーとの対話履歴を踏まえて、まだ聞き出せていない要素について「次の質問」を1つ投げかけてください。

【重要ルール】
- 質問は1つだけにしてください。丁寧なトーンで短く質問してください。
- ユーザーの直前の回答が「わからない」「特にない」「こだわりがない」など曖昧な場合は、質問を深掘りするのではなく、ユーザーが選びやすいように具体的な選択肢を2〜3個提案してください。
- 出力は必ず指定されたJSONフォーマットに従ってください。

対話履歴:
${formattedHistory}
`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          reply: {
            type: Type.STRING,
            description: "ユーザーへの返答文と次の質問"
          },
          options: {
            type: Type.ARRAY,
            description: "直前の回答が曖昧だった場合にユーザーに提示する選択肢の配列。曖昧でない場合は空配列。",
            items: { type: Type.STRING }
          },
          isAmbiguous: {
            type: Type.BOOLEAN,
            description: "ユーザーの直前の回答が曖昧だったかどうか（曖昧ならtrue）"
          }
        },
        required: ["reply", "options", "isAmbiguous"],
      };

      const response = await generateContentWithRotation({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const text = response.text;
      if (!text) throw new Error("APIからの応答が空でした。");
      
      const result = JSON.parse(text);
      return NextResponse.json(result);
    } 
    
    if (action === 'diagnose') {
      const prompt = `あなたは「起業・副業アイデアの方向性診断AI」です。
以下のユーザーとの対話履歴を分析し、最適なアイデアの方向性（診断結果）と、具体的なおすすめアイデアを1つ提案してください。

対話履歴:
${formattedHistory}

アイデアの『実現可能性（Feasibility）』を客観的に評価し、0〜100点の間でスコアを出してください。また、そのスコアをさらに向上させるために『まず何から始めるべきか』などの現実的なアクションプラン（改善案）も提示してください。さらに、検索用キーワードを3〜5個程度抽出してください。

出力は必ず以下のJSONフォーマットに従ってください。`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          diagnosis: {
            type: Type.STRING,
            description: "これまでの対話履歴から分析した、ユーザーの強みや方向性の解説（200〜300文字程度）"
          },
          idea: {
            type: Type.OBJECT,
            description: "おすすめのアイデア案",
            properties: {
              title: { type: Type.STRING, description: "アイデアのタイトル" },
              summary: { type: Type.STRING, description: "アイデアの概要" },
              target: { type: Type.STRING, description: "対象となるユーザー層の詳細" },
              differentiation: { type: Type.STRING, description: "既存サービスとの差別化ポイント" },
              monetization: { type: Type.STRING, description: "マネタイズ（収益化）の方法" },
              feasibilityScore: { type: Type.INTEGER, description: "アイデアの現実的な実現可能性（0〜100の数値。パーセント表示用）" },
              feasibilityActionPlan: { type: Type.STRING, description: "実現性スコアをさらに引き上げ、実際に形にするための具体的で現実的な一歩や改善案" },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "アイデアの特徴を表す検索用キーワード（3〜5個程度）"
              }
            },
            required: ["title", "summary", "target", "differentiation", "monetization", "feasibilityScore", "feasibilityActionPlan", "keywords"],
          }
        },
        required: ["diagnosis", "idea"],
      };

      const response = await generateContentWithRotation({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const text = response.text;
      if (!text) throw new Error("APIからの応答が空でした。");

      const result = JSON.parse(text);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: '無効なアクションです。' }, { status: 400 });

  } catch (error: any) {
    console.error("Diagnosis Chat API Error:", error);
    return NextResponse.json({ error: error.message || '通信に失敗しました。時間をおいて再度お試しください。' }, { status: 500 });
  }
}
