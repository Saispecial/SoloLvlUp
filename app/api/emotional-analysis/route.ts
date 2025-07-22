import { type NextRequest, NextResponse } from "next/server"

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
const MAX_RETRIES = 3
const BACKOFF_MS = 1000

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text: string }

    if (typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 })
    }

    // Use Gemini API for proper analysis
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      let attempt = 0

      while (attempt < MAX_RETRIES) {
        try {
          const prompt = `Analyze this text for emotional tone and provide a JSON response:
{
  "emotionalTone": "detailed emotional tone description",
  "sentiment": "positive|negative|neutral",
  "keyEmotions": ["emotion1", "emotion2", "emotion3"],
  "stressLevel": 1-10 number
}

Text: "${text}"

Guidelines:
- Identify the primary emotional tone
- Classify overall sentiment
- List 2-4 key emotions present
- Rate stress level from 1 (very calm) to 10 (extremely stressed)
- Consider physical symptoms as stress indicators
- Factor in relationship dynamics and health concerns

Respond ONLY with valid JSON:"`

          const payload = {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }

          const googleRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!googleRes.ok) {
            throw new Error(`Gemini API returned status ${googleRes.status}`)
          }

          const data = await googleRes.json()
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"

          let cleanedText = responseText
          if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
          }
          if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/```\n?/, "").replace(/\n?```$/, "")
          }

          const analysis = JSON.parse(cleanedText)

          if (analysis.emotionalTone && analysis.sentiment && analysis.keyEmotions && analysis.stressLevel) {
            return NextResponse.json(analysis, { status: 200 })
          } else {
            throw new Error("Invalid response structure from Gemini")
          }
        } catch (geminiError: any) {
          console.error(`Attempt ${attempt + 1}: Gemini API error:`, geminiError.message || geminiError)
          if (attempt < MAX_RETRIES - 1) {
            const delay = BACKOFF_MS * (attempt + 1)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
          attempt++
        }
      }
    }

    // Fallback heuristic analysis
    const lowerText = text.toLowerCase()

    let emotionalTone = "neutral and balanced"
    let sentiment: "positive" | "negative" | "neutral" = "neutral"
    let keyEmotions: string[] = ["calm"]
    let stressLevel = 5

    // Detect complex emotional states
    if (lowerText.match(/pain.*hope|hope.*pain|struggle.*fight/)) {
      emotionalTone = "conflicted but resilient"
      sentiment = "neutral"
      keyEmotions = ["hope", "pain", "determination", "exhaustion"]
      stressLevel = 7
    } else if (lowerText.match(/physical.*emotional|body.*heart|health.*relationship/)) {
      emotionalTone = "overwhelmed by multiple stressors"
      sentiment = "negative"
      keyEmotions = ["overwhelm", "pain", "vulnerability", "fatigue"]
      stressLevel = 8
    } else if (lowerText.match(/cycle|repeat|again.*disappoint/)) {
      emotionalTone = "emotionally exhausted from patterns"
      sentiment = "negative"
      keyEmotions = ["exhaustion", "disappointment", "frustration", "sadness"]
      stressLevel = 7
    }

    return NextResponse.json(
      {
        emotionalTone,
        sentiment,
        keyEmotions,
        stressLevel,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("emotional-analysis API error:", error)
    return NextResponse.json({ error: "Server error processing emotional analysis" }, { status: 500 })
  }
}
