import { NextResponse } from 'next/server';
import { Type, Schema } from '@google/genai';
import { generateContentWithRotation } from '@/lib/geminiRotation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { answers, sessionId } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: '回答データが必要です。' }, { status: 400 });
    }

    const formattedAnswers = answers.map((a: any) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

    const prompt = `以下の質問に対するユーザーの回答を分析し、最適なアイデアの方向性（診断結果）と、具体的なおすすめアイデアを1つ提案してください。

回答:
${formattedAnswers}

アイデアの『実現可能性（Feasibility）』を客観的に評価し、0〜100点の間でスコアを出してください。また、そのスコアをさらに向上させるために『まず何から始めるべきか』などの現実的なアクションプラン（改善案）も提示してください。さらに、検索用キーワードを3〜5個程度抽出してください。

出力は以下のJSONフォーマットに必ず従ってください。`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        diagnosis: {
          type: Type.STRING,
          description: "ユーザーの回答から分析した強みや方向性の解説（200文字程度）"
        },
        idea: {
          type: Type.OBJECT,
          description: "おすすめのアイデア案",
          properties: {
            title: {
              type: Type.STRING,
              description: "アイデアのタイトル"
            },
            summary: {
              type: Type.STRING,
              description: "アイデアの概要"
            },
            target: {
              type: Type.STRING,
              description: "対象となるユーザー層の詳細"
            },
            differentiation: {
              type: Type.STRING,
              description: "既存サービスとの差別化ポイント"
            },
            monetization: {
              type: Type.STRING,
              description: "マネタイズ（収益化）の方法"
            },
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
    if (!text) {
      throw new Error("APIからの応答が空でした。");
    }

    const result = JSON.parse(text);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Diagnosis API Error:", error);
    return NextResponse.json({ error: error.message || '通信に失敗しました。時間をおいて再度お試しください。' }, { status: 500 });
  }
}