import { type NextRequest, NextResponse } from "next/server"

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
const MAX_RETRIES = 3 // Maximum number of retries for Gemini API calls
const BACKOFF_MS = 1000 // Initial backoff time in milliseconds (1 second)

export async function POST(req: NextRequest) {
  try {
    const { diaryContent } = (await req.json()) as { diaryContent: string }

    if (typeof diaryContent !== "string" || diaryContent.trim() === "") {
      return NextResponse.json({ error: "Invalid diaryContent" }, { status: 400 })
    }

    // Use Gemini API for proper analysis
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      let attempt = 0
      let geminiResponseText: string | null = null

      while (attempt < MAX_RETRIES) {
        try {
          const prompt = `Analyze this diary entry and provide a JSON response with the following structure:
{
  "mood": "positive|negative|neutral|anxious|excited|sad|happy|stressed|calm|unwell|hopeful|conflicted|overwhelmed",
  "emotionalState": "detailed emotional description (2-4 words)",
  "currentChallenges": "main challenges or concerns mentioned",
  "motivationLevel": "1-10 scale as string"
}

Diary Entry: "${diaryContent}"

Guidelines for accurate analysis:
- Be empathetic and nuanced in your analysis
- For motivation level, consider these factors carefully:
  * Physical pain/health issues: Lower motivation (2-4)
  * Emotional pain from relationships: Significantly impacts motivation (2-5)
  * Hope despite struggles: Slight increase but still low-moderate (3-6)
  * Repeated disappointment cycles: Very low motivation (1-3)
  * Fighting through adversity: Moderate but strained (4-6)
  * Mixed emotions (hope + pain): Usually 3-5 range
- If someone mentions physical pain AND emotional turmoil, motivation should be 3-5 maximum
- If there's a cycle of hope followed by disappointment, motivation should be 2-4
- Look for emotional indicators like physical symptoms, relationship instability, health concerns
- Rate motivation based on actual energy/drive level, not just positive thinking
- Someone can be hopeful but still have very low motivation due to circumstances

Respond ONLY with valid JSON, no additional text

JSON Response:`

          const payload = {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }

          console.log(`Attempt ${attempt + 1}: Sending request to Gemini API (${GEMINI_URL})...`)

          const googleRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!googleRes.ok) {
            // If the response is not OK, throw an error to trigger retry or fallback
            throw new Error(`Gemini API returned status ${googleRes.status}: ${await googleRes.text()}`)
          }

          const data = await googleRes.json()
          geminiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"
          console.log(`Attempt ${attempt + 1}: Gemini response received.`)

          // If we got a response, try to parse it. If successful, break the retry loop.
          let cleanedText = geminiResponseText
          if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
          }
          if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/```\n?/, "").replace(/\n?```$/, "")
          }

          try {
            const analysis = JSON.parse(cleanedText)

            // Validate the response structure
            if (analysis.mood && analysis.emotionalState && analysis.currentChallenges && analysis.motivationLevel) {
              return NextResponse.json(analysis, { status: 200 })
            } else {
              // If structure is invalid, throw error to trigger retry or fallback
              throw new Error("Invalid response structure from Gemini")
            }
          } catch (parseError) {
            console.error(`Attempt ${attempt + 1}: Failed to parse Gemini response:`, cleanedText)
            // This error might be due to a malformed response, which can sometimes be transient.
            // We'll let the retry logic handle it up to MAX_RETRIES.
            throw parseError // Re-throw to be caught by the outer try-catch for retry logic
          }
        } catch (geminiError: any) {
          console.error(`Attempt ${attempt + 1}: Gemini API error:`, geminiError.message || geminiError)
          if (attempt < MAX_RETRIES - 1) {
            const delay = BACKOFF_MS * (attempt + 1)
            console.log(`Retrying in ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
          attempt++
        }
      }

      // If loop finishes without returning, it means all retries failed or an unhandled error occurred.
      console.warn("All Gemini API attempts failed. Falling back to heuristic analysis.")
    } else {
      console.warn("GEMINI_API_KEY not found. Falling back to heuristic analysis.")
    }

    // Enhanced heuristic analysis as fallback with better motivation scoring
    const lowerContent = diaryContent.toLowerCase()

    // Enhanced mood detection
    let mood = "neutral"
    let emotionalState = "balanced"
    let motivationLevel = "5"

    // Complex emotional states - check for mixed emotions first
    if (lowerContent.match(/hope|hopeful/) && lowerContent.match(/pain|hurt|sorrow|sad/)) {
      mood = "conflicted"
      emotionalState = "hopeful but struggling"
      motivationLevel = "3" // Hope with pain = low motivation
    }
    // Physical health + emotional pain combination
    else if (
      lowerContent.match(/body|physical|pain|swollen|bump|neck|heart/) &&
      lowerContent.match(/emotional|relationship|love|sorrow|neglect/)
    ) {
      mood = "overwhelmed"
      emotionalState = "physically and emotionally drained"
      motivationLevel = "2" // Physical + emotional pain = very low motivation
    }
    // Relationship cycles (hope then disappointment)
    else if (lowerContent.match(/happiness.*sorrow|happy.*sad|love.*neglect|accept.*end/)) {
      mood = "conflicted"
      emotionalState = "emotionally exhausted"
      motivationLevel = "3" // Emotional rollercoaster = low motivation
    }
    // Health issues with pain
    else if (lowerContent.match(/body.*not supporting|physical.*pain|swollen|bump|heart.*heavy/)) {
      mood = "unwell"
      emotionalState = "physically struggling"
      motivationLevel = "3" // Physical limitations = low motivation
    }
    // Relationship instability
    else if (lowerContent.match(/neglect|relationship.*unstable|love.*sorrow|emotional.*dependency/)) {
      mood = "sad"
      emotionalState = "emotionally vulnerable"
      motivationLevel = "4" // Relationship issues = low-moderate motivation
    }
    // Hope despite struggles
    else if (
      lowerContent.match(/hope|control.*emotions|fighting|trying/) &&
      lowerContent.match(/pain|struggle|difficult|hard/)
    ) {
      mood = "hopeful"
      emotionalState = "determined but weary"
      motivationLevel = "4" // Hope with struggle = low-moderate motivation
    }
    // Standard health and wellness indicators
    else if (lowerContent.match(/not feeling well|sick|ill|unwell|tired|exhausted|drained/)) {
      mood = "unwell"
      emotionalState = "physically drained"
      motivationLevel = "3"
    }
    // Stress and anxiety indicators
    else if (lowerContent.match(/stressed|anxious|worried|overwhelmed|panic|nervous/)) {
      mood = "stressed"
      emotionalState = "mentally strained"
      motivationLevel = "4"
    }
    // Positive indicators
    else if (lowerContent.match(/happy|great|good|excited|amazing|wonderful|fantastic|love|joy/)) {
      mood = "positive"
      emotionalState = "uplifted and energetic"
      motivationLevel = "8"
    }
    // Negative indicators
    else if (lowerContent.match(/sad|depressed|down|upset|angry|frustrated|disappointed|hurt/)) {
      mood = "negative"
      emotionalState = "emotionally low"
      motivationLevel = "3"
    }
    // Calm/peaceful indicators
    else if (lowerContent.match(/calm|peaceful|relaxed|content|serene|tranquil/)) {
      mood = "calm"
      emotionalState = "peaceful and centered"
      motivationLevel = "6"
    }

    // Enhanced challenge detection
    let currentChallenges = "Daily routines"

    if (lowerContent.match(/health.*issues|physical.*pain|body.*not.*supporting|medical/)) {
      currentChallenges = "Health issues and physical pain management"
    } else if (lowerContent.match(/relationship.*instability|emotional.*dependency|love.*cycles/)) {
      currentChallenges = "Relationship instability and emotional dependency"
    } else if (lowerContent.match(/work|job|career|boss|colleague|deadline|project/)) {
      currentChallenges = "Work-related stress and responsibilities"
    } else if (lowerContent.match(/health|sick|doctor|medicine|pain|tired|fatigue/)) {
      currentChallenges = "Health and wellness concerns"
    } else if (lowerContent.match(/relationship|family|friend|partner|conflict|social/)) {
      currentChallenges = "Relationship and social dynamics"
    } else if (lowerContent.match(/money|financial|budget|expensive|cost|debt/)) {
      currentChallenges = "Financial pressures and planning"
    } else if (lowerContent.match(/study|exam|school|university|learning|course|academic/)) {
      currentChallenges = "Academic and learning goals"
    } else if (lowerContent.match(/goal|dream|future|plan|ambition|direction/)) {
      currentChallenges = "Personal growth and future planning"
    } else if (lowerContent.match(/time|busy|schedule|rush|deadline|manage/)) {
      currentChallenges = "Time management and priorities"
    } else if (lowerContent.match(/sleep|insomnia|rest/)) {
      currentChallenges = "Sleep patterns and rest"
    } else if (lowerContent.match(/diet|food|eating|nutrition/)) {
      currentChallenges = "Diet and nutrition"
    } else if (lowerContent.match(/exercise|workout|fitness|activity/)) {
      currentChallenges = "Physical activity and fitness"
    }

    // More nuanced motivation adjustment based on content complexity and emotional indicators
    const currentMotivation = Number.parseInt(motivationLevel)

    // Reduce motivation for multiple stressors
    let stressorCount = 0
    if (lowerContent.match(/pain|hurt|physical/)) stressorCount++
    if (lowerContent.match(/emotional|relationship|love/)) stressorCount++
    if (lowerContent.match(/neglect|disappoint|sorrow/)) stressorCount++
    if (lowerContent.match(/cycle|repeat|again/)) stressorCount++

    if (stressorCount >= 3) {
      motivationLevel = Math.max(currentMotivation - 2, 1).toString()
    } else if (stressorCount >= 2) {
      motivationLevel = Math.max(currentMotivation - 1, 1).toString()
    }

    // Adjust for content length and emotional complexity
    if (diaryContent.length > 300 && currentMotivation < 4) {
      // Long detailed entries about struggles often indicate lower motivation
      motivationLevel = Math.max(currentMotivation - 1, 1).toString()
    } else if (diaryContent.length < 50 && currentMotivation > 3) {
      // Very short entries might indicate lack of energy/motivation
      motivationLevel = Math.max(currentMotivation - 1, 1).toString()
    }

    return NextResponse.json(
      {
        mood,
        emotionalState,
        currentChallenges,
        motivationLevel,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("diary-conversion API error:", error)
    return NextResponse.json({ error: "Server error processing diary entry", details: error.message }, { status: 500 })
  }
}
