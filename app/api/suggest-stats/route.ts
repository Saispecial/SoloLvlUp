import { type NextRequest, NextResponse } from "next/server"
import { getSuggestedStatsFromAI } from "@/lib/ai-stats"

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title && !description) {
      return NextResponse.json({ error: "Title or description is required" }, { status: 400 })
    }

    const suggestedStats = await getSuggestedStatsFromAI(title || "", description || "")

    return NextResponse.json({
      suggestedStats,
      reasoning: "AI analysis based on quest content and keywords",
    })
  } catch (error) {
    console.error("Error in suggest-stats API:", error)
    return NextResponse.json({ error: "Failed to generate stat suggestions" }, { status: 500 })
  }
}
