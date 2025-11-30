"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Brain,
  Heart,
  Target,
  TrendingUp,
  Award,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react"
import { usePlayerStore } from "@/stores/player-store"
import { getGeminiInsight } from "@/lib/gemini-api"
import type { PlayerProfile, Quest } from "@/lib/types"

// Add type declarations for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
    SpeechSynthesisUtterance: any
  }
}

interface Message {
  sender: "agent" | "user"
  text: string
  loading?: boolean
  timestamp: Date
  category?: "general" | "coaching" | "analytics" | "emotional" | "achievement" | "quest"
  metadata?: any
}

interface ConversationContext {
  lastTopics: string[]
  userMood: string
  sessionGoals: string[]
  conversationDepth: number
  preferredResponseStyle: "motivational" | "analytical" | "casual" | "coaching"
}

interface AgentPersonality {
  empathy: number
  motivation: number
  analytical: number
  humor: number
  formality: number
}

type ResponseLength = "brief" | "normal" | "detailed"

const agentName = "Arise"
const agentAvatar = <Bot className="w-8 h-8 text-cyan-400 animate-bounce" />

// Enhanced personality system
const AGENT_PERSONALITY: AgentPersonality = {
  empathy: 0.8,
  motivation: 0.9,
  analytical: 0.7,
  humor: 0.6,
  formality: 0.3,
}

// Contextual prompts based on user state
const getContextualPrompts = (player: PlayerProfile, completedQuests: Quest[], context: ConversationContext) => {
  const prompts = []

  // Based on streak
  if (player.streak === 0) {
    prompts.push("Help me start a new streak", "What's the best way to build consistency?")
  } else if (player.streak > 7) {
    prompts.push("How can I maintain my streak?", "What's my streak potential?")
  }

  // Based on level
  if (player.level < 5) {
    prompts.push("Tips for leveling up faster", "What should I focus on as a beginner?")
  } else {
    prompts.push("Advanced strategies for my level", "How do I optimize my growth?")
  }

  // Based on recent activity
  const recentQuests = completedQuests.filter(
    (q) => new Date(q.completedAt!).getTime() > Date.now() - 24 * 60 * 60 * 1000,
  )

  if (recentQuests.length === 0) {
    prompts.push("Motivate me to complete quests", "What quest should I do today?")
  } else {
    prompts.push("Analyze my recent performance", "What patterns do you see?")
  }

  // Emotional support
  prompts.push("I need emotional support", "Help me set better goals", "What's my biggest strength?")

  return prompts.slice(0, 6)
}

export function TalkingAgent() {
  const {
    player,
    getPerformanceMetrics,
    getMoodTrends,
    getWeeklyStats,
    getMonthlyProgress,
    completedQuests,
    quests,
    getDiaryEntries,
    getReflections,
    achievements,
    getRealmPerformance,
  } = usePlayerStore()

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "agent",
      text: `Hunter ${player.name || "Unknown"}, I'm ${agentName}. Ready to analyze your journey and provide guidance. How can I assist?`,
      timestamp: new Date(),
      category: "general",
    },
  ])

  const [input, setInput] = useState("")
  const [show, setShow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [responseLength, setResponseLength] = useState<ResponseLength>("normal")
  const [context, setContext] = useState<ConversationContext>({
    lastTopics: [],
    userMood: "neutral",
    sessionGoals: [],
    conversationDepth: 0,
    preferredResponseStyle: "motivational",
  })

  const lastStats = useRef<any>({})
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [isListening, setIsListening] = useState(false)
  const [recognitionState, setRecognitionState] = useState<"idle" | "starting" | "listening" | "stopping">("idle")
  const recognitionRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1.1,
    pitch: 1.2,
    volume: 0.8,
  })

  // Wake word detection state
  const [isWakeListening, setIsWakeListening] = useState(false)
  const [wakeRecognitionState, setWakeRecognitionState] = useState<"idle" | "starting" | "listening" | "stopping">(
    "idle",
  )
  const wakeRecognitionRef = useRef<any>(null)
  const wakeErrorCountRef = useRef(0)
  const wakeRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true)

  const supportsSpeech =
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window

  useEffect(() => {
    setMounted(true)

    // Load saved settings from localStorage
    const savedResponseLength = localStorage.getItem("arise-response-length") as ResponseLength
    if (savedResponseLength) {
      setResponseLength(savedResponseLength)
    }

    const savedSpeechEnabled = localStorage.getItem("arise-speech-enabled")
    if (savedSpeechEnabled !== null) {
      setSpeechEnabled(JSON.parse(savedSpeechEnabled))
    }

    const savedWakeWordEnabled = localStorage.getItem("arise-wake-word-enabled")
    if (savedWakeWordEnabled !== null) {
      setWakeWordEnabled(JSON.parse(savedWakeWordEnabled))
    }

    // Cleanup function to ensure we stop all recognition on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
          recognitionRef.current = null
        } catch (e) {
          console.error("Error cleaning up recognition:", e)
        }
      }

      if (wakeRecognitionRef.current) {
        try {
          wakeRecognitionRef.current.abort()
          wakeRecognitionRef.current = null
        } catch (e) {
          console.error("Error cleaning up wake recognition:", e)
        }
      }

      if (wakeRetryTimeoutRef.current) {
        clearTimeout(wakeRetryTimeoutRef.current)
      }
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("arise-response-length", responseLength)
  }, [responseLength])

  useEffect(() => {
    localStorage.setItem("arise-speech-enabled", JSON.stringify(speechEnabled))
  }, [speechEnabled])

  useEffect(() => {
    localStorage.setItem("arise-wake-word-enabled", JSON.stringify(wakeWordEnabled))
  }, [wakeWordEnabled])

  // Enhanced proactive feedback system
  useEffect(() => {
    const stats = {
      streak: player.streak,
      xp: player.totalXp,
      mood: getWeeklyStats().averageMood,
      quests: completedQuests.length,
      level: player.level,
      achievements: achievements.filter((a) => a.unlocked).length,
    }

    if (JSON.stringify(stats) !== JSON.stringify(lastStats.current)) {
      const feedback = generateEnhancedProactiveComment(stats, lastStats.current)
      if (feedback) {
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "agent",
            text: feedback.text,
            timestamp: new Date(),
            category: feedback.category,
            metadata: feedback.metadata,
          },
        ])
      }
      lastStats.current = stats
    }

    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [player.streak, player.totalXp, player.level, completedQuests.length, achievements])

  // Enhanced speech synthesis with personality
  const speakMessage = useCallback(
    (text: string, emotion: "neutral" | "excited" | "supportive" | "analytical" = "neutral") => {
      if (!supportsTTS || !speechEnabled) return

      const utter = new window.SpeechSynthesisUtterance(text)

      // Adjust voice based on emotion and personality
      switch (emotion) {
        case "excited":
          utter.rate = voiceSettings.rate * 1.2
          utter.pitch = voiceSettings.pitch * 1.1
          break
        case "supportive":
          utter.rate = voiceSettings.rate * 0.9
          utter.pitch = voiceSettings.pitch * 0.95
          break
        case "analytical":
          utter.rate = voiceSettings.rate * 0.95
          utter.pitch = voiceSettings.pitch * 0.9
          break
        default:
          utter.rate = voiceSettings.rate
          utter.pitch = voiceSettings.pitch
      }

      utter.volume = voiceSettings.volume
      utter.lang = "en-US"

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    },
    [supportsTTS, speechEnabled, voiceSettings],
  )

  // Enhanced speech synthesis effect
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.sender === "agent" && lastMsg.text && !lastMsg.loading) {
      const emotion = determineEmotionFromCategory(lastMsg.category)
      speakMessage(lastMsg.text, emotion)
    }
  }, [messages, speakMessage])

  // Determine emotion from message category
  const determineEmotionFromCategory = (category?: string): "neutral" | "excited" | "supportive" | "analytical" => {
    switch (category) {
      case "achievement":
      case "coaching":
        return "excited"
      case "emotional":
        return "supportive"
      case "analytics":
        return "analytical"
      default:
        return "neutral"
    }
  }

  // Enhanced speech recognition setup with proper state management
  useEffect(() => {
    if (!supportsSpeech) return

    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = "en-US"
        recognition.interimResults = false
        recognition.maxAlternatives = 3
        recognition.continuous = false

        recognition.onstart = () => {
          setRecognitionState("listening")
          setIsListening(true)
        }

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          const confidence = event.results[0][0].confidence

          if (confidence > 0.7) {
            setInput(transcript)
            handleSend(transcript)
          } else {
            setMessages((msgs) => [
              ...msgs,
              {
                sender: "agent",
                text: "I didn't catch that clearly. Could you repeat?",
                timestamp: new Date(),
                category: "general",
              },
            ])
          }
        }

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setRecognitionState("idle")
          setIsListening(false)
        }

        recognition.onend = () => {
          setRecognitionState("idle")
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }
  }, [supportsSpeech])

  // Create a separate function for initializing wake recognition
  const initializeWakeRecognition = useCallback(() => {
    if (!supportsSpeech || wakeRecognitionRef.current) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onstart = () => {
      setWakeRecognitionState("listening")
      setIsWakeListening(true)
      wakeErrorCountRef.current = 0 // Reset error count on successful start
    }

    recognition.onresult = (event: any) => {
      if (!wakeWordEnabled) return

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim().toLowerCase()
        const wakeWords = ["arise", "hey arise", "arise help", "arise assist"]

        if (wakeWords.some((word) => transcript.includes(word))) {
          try {
            recognition.stop()
            setWakeRecognitionState("stopping")
          } catch (e) {
            console.error("Error stopping wake recognition after wake word:", e)
          }

          setShow(true)

          // Contextual greeting based on time and user state
          const greeting = generateContextualGreeting()
          setTimeout(() => {
            setMessages((msgs) => [
              ...msgs,
              {
                sender: "agent",
                text: greeting,
                timestamp: new Date(),
                category: "general",
              },
            ])
          }, 500)
          break
        }
      }
    }

    recognition.onerror = (event: any) => {
      const errorCode = event.error

      if (errorCode === "aborted") {
        // Silently handle aborted errors - they're normal and don't need aggressive retry
        console.log("[v0] Wake recognition was aborted (normal operation)")
        wakeErrorCountRef.current = 0 // Reset error count for normal aborts
      } else if (errorCode === "not-allowed") {
        // User denied permission
        setWakeWordEnabled(false)
        console.log("Wake word detection disabled due to permission denial")
      } else if (errorCode === "network") {
        // Network error - increment retry counter
        wakeErrorCountRef.current += 1
        console.warn("Wake recognition network error, retry count:", wakeErrorCountRef.current)
      } else if (errorCode === "no-speech") {
        // No speech detected - this is normal, don't increment error count
        console.log("[v0] No speech detected in wake word listening")
      } else {
        // Other errors
        console.warn("Wake recognition error:", errorCode)
        wakeErrorCountRef.current += 1
      }

      setWakeRecognitionState("idle")
      setIsWakeListening(false)
    }

    recognition.onend = () => {
      setWakeRecognitionState("idle")
      setIsWakeListening(false)

      if (wakeWordEnabled && !show && wakeErrorCountRef.current < 3) {
        // Implement exponential backoff for retries
        const retryDelay = Math.min(500 * Math.pow(1.5, wakeErrorCountRef.current), 5000)

        if (wakeRetryTimeoutRef.current) {
          clearTimeout(wakeRetryTimeoutRef.current)
        }

        wakeRetryTimeoutRef.current = setTimeout(() => {
          if (!show && wakeWordEnabled && wakeRecognitionRef.current) {
            try {
              wakeRecognitionRef.current.start()
            } catch (e) {
              console.log("[v0] Could not restart wake recognition:", (e as Error).message)
            }
          }
        }, retryDelay)
      } else if (wakeErrorCountRef.current >= 3) {
        // Too many errors - disable temporarily
        console.log("[v0] Too many wake recognition errors, pausing for 20 seconds")
        setWakeWordEnabled(false)
        setTimeout(() => {
          setWakeWordEnabled(true)
          wakeErrorCountRef.current = 0
        }, 20000)
      }
    }

    wakeRecognitionRef.current = recognition
  }, [supportsSpeech, wakeWordEnabled]) // Removed show and wakeRecognitionState to prevent unnecessary re-initialization

  // Enhanced wake word detection with proper state management and error handling
  useEffect(() => {
    if (!supportsSpeech || !wakeWordEnabled || show) {
      // Stop wake recognition if it's running
      if (wakeRecognitionRef.current) {
        try {
          wakeRecognitionRef.current.stop()
        } catch (e) {
          console.log("[v0] Could not stop wake recognition")
        }
      }

      // Clear any pending retry timeouts
      if (wakeRetryTimeoutRef.current) {
        clearTimeout(wakeRetryTimeoutRef.current)
        wakeRetryTimeoutRef.current = null
      }

      setIsWakeListening(false)
      return
    }

    // Initialize wake recognition if needed
    if (!wakeRecognitionRef.current) {
      initializeWakeRecognition()
      // Start it after initialization
      setTimeout(() => {
        if (wakeRecognitionRef.current && wakeRecognitionState === "idle") {
          try {
            wakeRecognitionRef.current.start()
          } catch (e) {
            console.log("[v0] Could not start wake recognition:", (e as Error).message)
          }
        }
      }, 100)
    }

    // Cleanup function
    return () => {
      if (wakeRetryTimeoutRef.current) {
        clearTimeout(wakeRetryTimeoutRef.current)
        wakeRetryTimeoutRef.current = null
      }
    }
  }, [supportsSpeech, show, wakeWordEnabled, initializeWakeRecognition]) // Removed wakeRecognitionState

  // Helper function to start wake recognition safely
  const startWakeRecognition = () => {
    if (!wakeRecognitionRef.current || wakeRecognitionState !== "idle" || !wakeWordEnabled) return

    try {
      setWakeRecognitionState("starting")
      wakeRecognitionRef.current.start()
    } catch (e) {
      console.error("Error starting wake recognition:", e)
      setWakeRecognitionState("idle")
      setIsWakeListening(false)

      // Increment error count for backoff strategy
      wakeErrorCountRef.current += 1

      // If we've had too many errors, disable wake word temporarily
      if (wakeErrorCountRef.current > 5) {
        console.log("Too many wake word errors, disabling temporarily")
        // Re-enable after 30 seconds
        setTimeout(() => {
          wakeErrorCountRef.current = 0
        }, 30000)
      }
    }
  }

  // Generate contextual greeting
  const generateContextualGreeting = () => {
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

    const recentQuests = completedQuests.filter(
      (q) => new Date(q.completedAt!).getTime() > Date.now() - 24 * 60 * 60 * 1000,
    ).length

    if (recentQuests > 0) {
      return `${timeGreeting}, Hunter! I see you've been active with ${recentQuests} quest${recentQuests > 1 ? "s" : ""} completed recently. How can I assist you further?`
    } else {
      return `${timeGreeting}, Hunter! Ready to tackle some new challenges today?`
    }
  }

  // Enhanced user input handler with context awareness
  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      sender: "user",
      text,
      timestamp: new Date(),
      category: categorizeUserInput(text),
    }

    setMessages((msgs) => [...msgs, userMessage])
    setInput("")
    setIsLoading(true)

    // Update conversation context
    updateConversationContext(text, userMessage.category!)

    // Handle special commands
    const lowerText = text.trim().toLowerCase()
    if (handleSpecialCommands(lowerText)) {
      setIsLoading(false)
      return
    }

    // Generate enhanced response
    try {
      const response = await generateEnhancedResponse(text, userMessage.category!)
      setMessages((msgs) => [...msgs, response])
    } catch (error) {
      console.error("Error generating response:", error)
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "agent",
          text: "I encountered an error processing your request. Let me try a different approach.",
          timestamp: new Date(),
          category: "general",
        },
      ])
    }

    setIsLoading(false)
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Categorize user input for better response handling
  const categorizeUserInput = (text: string): Message["category"] => {
    const lower = text.toLowerCase()

    if (
      lower.includes("feel") ||
      lower.includes("mood") ||
      lower.includes("emotion") ||
      lower.includes("sad") ||
      lower.includes("happy") ||
      lower.includes("stressed")
    ) {
      return "emotional"
    }
    if (lower.includes("quest") || lower.includes("goal") || lower.includes("challenge")) {
      return "quest"
    }
    if (lower.includes("achievement") || lower.includes("unlock") || lower.includes("badge")) {
      return "achievement"
    }
    if (
      lower.includes("stats") ||
      lower.includes("analytics") ||
      lower.includes("performance") ||
      lower.includes("data")
    ) {
      return "analytics"
    }
    if (lower.includes("help") || lower.includes("advice") || lower.includes("tip") || lower.includes("improve")) {
      return "coaching"
    }

    return "general"
  }

  // Update conversation context
  const updateConversationContext = (text: string, category: string) => {
    setContext((prev) => ({
      ...prev,
      lastTopics: [category, ...prev.lastTopics.slice(0, 4)],
      conversationDepth: prev.conversationDepth + 1,
      userMood: detectUserMood(text),
    }))
  }

  // Detect user mood from text
  const detectUserMood = (text: string): string => {
    const lower = text.toLowerCase()

    if (
      lower.includes("great") ||
      lower.includes("awesome") ||
      lower.includes("amazing") ||
      lower.includes("excited")
    ) {
      return "positive"
    }
    if (lower.includes("sad") || lower.includes("down") || lower.includes("frustrated") || lower.includes("tired")) {
      return "negative"
    }
    if (lower.includes("okay") || lower.includes("fine") || lower.includes("alright")) {
      return "neutral"
    }

    return "neutral"
  }

  // Handle special commands
  const handleSpecialCommands = (text: string): boolean => {
    if (text === "stop" || text === "be quiet" || text === "silence") {
      if (supportsTTS) window.speechSynthesis.cancel()
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "agent",
          text: "Speech stopped. I'm here when you need me, Hunter.",
          timestamp: new Date(),
          category: "general",
        },
      ])
      return true
    }

    if (text === "clear chat" || text === "reset conversation") {
      setMessages([
        {
          sender: "agent",
          text: "Conversation cleared. Fresh start, Hunter! How can I help you?",
          timestamp: new Date(),
          category: "general",
        },
      ])
      setContext({
        lastTopics: [],
        userMood: "neutral",
        sessionGoals: [],
        conversationDepth: 0,
        preferredResponseStyle: "motivational",
      })
      return true
    }

    if (text.startsWith("set voice ")) {
      const setting = text.replace("set voice ", "")
      if (setting === "fast") {
        setVoiceSettings((prev) => ({ ...prev, rate: 1.3 }))
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "agent",
            text: "Voice speed increased to fast.",
            timestamp: new Date(),
            category: "general",
          },
        ])
      } else if (setting === "slow") {
        setVoiceSettings((prev) => ({ ...prev, rate: 0.8 }))
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "agent",
            text: "Voice speed decreased to slow.",
            timestamp: new Date(),
            category: "general",
          },
        ])
      }
      return true
    }

    // Response length commands
    if (text === "brief mode" || text === "short responses") {
      setResponseLength("brief")
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "agent",
          text: "Brief mode activated. Responses will be concise.",
          timestamp: new Date(),
          category: "general",
        },
      ])
      return true
    }

    if (text === "normal mode" || text === "normal responses") {
      setResponseLength("normal")
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "agent",
          text: "Normal mode activated. Balanced response length.",
          timestamp: new Date(),
          category: "general",
        },
      ])
      return true
    }

    if (text === "detailed mode" || text === "detailed responses") {
      setResponseLength("detailed")
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "agent",
          text: "Detailed mode activated. Comprehensive responses enabled.",
          timestamp: new Date(),
          category: "general",
        },
      ])
      return true
    }

    // Toggle wake word detection
    if (text === "disable wake word" || text === "turn off wake word") {
      setWakeWordEnabled(false)
      if (wakeRecognitionRef.current && wakeRecognitionState === "listening") {
        try {
          wakeRecognitionRef.current.stop()
        } catch (e) {
          console.error("Error stopping wake recognition:", e)
        }
      }
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "agent",
          text: "Wake word detection disabled. You can enable it again by saying 'enable wake word'.",
          timestamp: new Date(),
          category: "general",
        },
      ])
      return true
    }

    if (text === "enable wake word" || text === "turn on wake word") {
      setWakeWordEnabled(true)
      wakeErrorCountRef.current = 0
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "agent",
          text: "Wake word detection enabled. You can now say 'Arise' to activate me.",
          timestamp: new Date(),
          category: "general",
        },
      ])
      return true
    }

    return false
  }

  // Generate enhanced response with context awareness
  const generateEnhancedResponse = async (text: string, category: string): Promise<Message> => {
    const lower = text.toLowerCase()

    // Try local enhanced responses first
    const localResponse = generateLocalEnhancedResponse(text, category)
    if (localResponse) {
      return {
        sender: "agent",
        text: localResponse.text,
        timestamp: new Date(),
        category: localResponse.category,
        metadata: localResponse.metadata,
      }
    }

    // Use Gemini API for complex queries
    try {
      const contextualPrompt = buildContextualPrompt(text, category)
      const geminiReply = await getGeminiInsight(contextualPrompt, player)

      return {
        sender: "agent",
        text: geminiReply,
        timestamp: new Date(),
        category,
        metadata: { source: "gemini", context: context.lastTopics },
      }
    } catch (error) {
      return {
        sender: "agent",
        text: "I'm having trouble accessing my advanced analysis right now, but I'm still here to help with what I know!",
        timestamp: new Date(),
        category: "general",
      }
    }
  }

  // Build contextual prompt for Gemini
  const buildContextualPrompt = (text: string, category: string): string => {
    const contextInfo = {
      playerLevel: player.level,
      streak: player.streak,
      recentMood: context.userMood,
      conversationHistory: context.lastTopics.slice(0, 3),
      totalQuests: completedQuests.length,
      achievements: achievements.filter((a) => a.unlocked).length,
    }

    const lengthInstruction = {
      brief: "Keep responses very short and concise (1-2 sentences max).",
      normal: "Provide balanced responses with key information.",
      detailed: "Give comprehensive, detailed responses with examples and explanations.",
    }

    return `Context: Player is level ${contextInfo.playerLevel} with ${contextInfo.streak}-day streak, mood: ${contextInfo.recentMood}, recent topics: ${contextInfo.conversationHistory.join(", ")}. 
    
Response style: ${lengthInstruction[responseLength]}

User question (${category}): ${text}

Please respond as Arise, an empathetic AI companion for a solo RPG leveling system. Be encouraging, insightful, and personalized based on the context.`
  }

  // Generate local enhanced responses with length consideration
  const generateLocalEnhancedResponse = (text: string, category: string) => {
    const lower = text.toLowerCase()

    // Enhanced quest responses
    if (category === "quest" || lower.includes("quest")) {
      return generateQuestResponse(lower)
    }

    // Enhanced emotional responses
    if (category === "emotional") {
      return generateEmotionalResponse(lower)
    }

    // Enhanced analytics responses
    if (category === "analytics") {
      return generateAnalyticsResponse(lower)
    }

    // Enhanced achievement responses
    if (category === "achievement") {
      return generateAchievementResponse(lower)
    }

    // Enhanced coaching responses
    if (category === "coaching") {
      return generateCoachingResponse(lower)
    }

    return null
  }

  // Generate quest-specific responses with length variations and real-time data
  const generateQuestResponse = (lower: string) => {
    const activeQuests = quests.filter((q) => !q.completed)
    const completedToday = completedQuests.filter(
      (q) => new Date(q.completedAt!).toDateString() === new Date().toDateString(),
    )

    // Handle "current active quests" or similar queries
    if (lower.includes("current") || lower.includes("active") || lower.includes("what quest")) {
      if (activeQuests.length === 0) {
        const responses = {
          brief: "No active quests. Create new ones?",
          normal: "No active quests, Hunter. Time to create new challenges. Need help brainstorming?",
          detailed:
            "You have no active quests, Hunter! This is the perfect opportunity to create new challenges that align with your current goals and aspirations. Consider what skills you want to develop, what habits you want to build, or what personal projects you want to tackle. I can help you brainstorm specific, actionable quests that will drive your growth forward. What area of your life would you like to focus on?",
        }
        return {
          text: responses[responseLength],
          category: "quest" as const,
          metadata: { questCount: 0, suggestion: true },
        }
      }

      // Show actual active quests
      const questList = activeQuests.slice(0, 5).map((q, i) => {
        const difficultyEmoji =
          {
            Easy: "🟢",
            Medium: "🟡",
            Hard: "🔴",
            "Life Achievement": "🏆",
          }[q.difficulty] || "⚪"

        return `${i + 1}. ${difficultyEmoji} ${q.title} (+${q.xp} XP) - ${q.realm}`
      })

      const responses = {
        brief: `${activeQuests.length} active quests:\n${questList.slice(0, 3).join("\n")}${activeQuests.length > 3 ? `\n...and ${activeQuests.length - 3} more` : ""}`,
        normal: `You have ${activeQuests.length} active quests, Hunter:\n\n${questList.join("\n")}\n\nWhich one calls to you today?`,
        detailed: `Here are your ${activeQuests.length} active quests, Hunter:\n\n${questList.join("\n")}\n\n${activeQuests.length > 5 ? `...and ${activeQuests.length - 5} more quests awaiting your attention.\n\n` : ""}Each quest represents a step toward your growth. The easy quests (🟢) are perfect for building momentum, while medium (🟡) and hard (🔴) quests offer greater rewards and skill development. Life Achievement quests (🏆) are your legendary challenges.\n\nI recommend starting with an easy quest if you need momentum, or tackling a medium quest if you're feeling energized. Which realm calls to you today?`,
      }

      return {
        text: responses[responseLength],
        category: "quest" as const,
        metadata: { activeQuests: activeQuests.length, questList },
      }
    }

    if (lower.includes("suggest") || lower.includes("recommend")) {
      if (activeQuests.length === 0) {
        const responses = {
          brief: "No quests. Create new ones?",
          normal: "No active quests, Hunter. Time to create new challenges. Need help brainstorming?",
          detailed:
            "You have no active quests, Hunter! This is the perfect opportunity to create new challenges that align with your current goals and aspirations. Consider what skills you want to develop, what habits you want to build, or what personal projects you want to tackle. I can help you brainstorm specific, actionable quests that will drive your growth forward. What area of your life would you like to focus on?",
        }
        return {
          text: responses[responseLength],
          category: "quest" as const,
          metadata: { questCount: 0, suggestion: true },
        }
      }

      const easyQuests = activeQuests.filter((q) => q.difficulty === "Easy")
      const mediumQuests = activeQuests.filter((q) => q.difficulty === "Medium")

      if (completedToday.length === 0 && easyQuests.length > 0) {
        const responses = {
          brief: `Try "${easyQuests[0].title}"`,
          normal: `Try "${easyQuests[0].title}" - easy win to build momentum.`,
          detailed: `Start your day strong, Hunter! I recommend tackling "${easyQuests[0].title}" first. It's an easy difficulty quest that will give you a quick win and build momentum for tackling bigger challenges later. Easy quests are perfect for getting into the flow state and proving to yourself that you can accomplish your goals. Once you complete this, you'll have the confidence and energy to take on more demanding tasks.`,
        }
        return {
          text: responses[responseLength],
          category: "quest" as const,
          metadata: { recommendation: easyQuests[0].title, difficulty: "Easy" },
        }
      }

      if (completedToday.length > 0 && mediumQuests.length > 0) {
        const responses = {
          brief: `${completedToday.length} done! Try "${mediumQuests[0].title}"?`,
          normal: `${completedToday.length} done today! Ready for "${mediumQuests[0].title}"?`,
          detailed: `Excellent work, Hunter! You've already completed ${completedToday.length} quest${completedToday.length > 1 ? "s" : ""} today, which shows you're in a productive flow state. Now that you've built momentum with those wins, you're perfectly positioned to tackle "${mediumQuests[0].title}". Medium difficulty quests require more focus and effort, but with your current momentum, you have the energy and confidence to succeed. This quest will challenge you appropriately and provide significant growth.`,
        }
        return {
          text: responses[responseLength],
          category: "quest" as const,
          metadata: { recommendation: mediumQuests[0].title, difficulty: "Medium" },
        }
      }

      // General recommendation from available quests
      const recommendedQuest = activeQuests[0]
      const responses = {
        brief: `Try "${recommendedQuest.title}" (${recommendedQuest.difficulty})`,
        normal: `I recommend "${recommendedQuest.title}" - ${recommendedQuest.difficulty} difficulty, +${recommendedQuest.xp} XP in ${recommendedQuest.realm}.`,
        detailed: `Based on your current active quests, I recommend "${recommendedQuest.title}". This ${recommendedQuest.difficulty} difficulty quest in the ${recommendedQuest.realm} realm will reward you with ${recommendedQuest.xp} XP upon completion.\n\nDescription: ${recommendedQuest.description}\n\nThis quest aligns well with your current level and will contribute to your growth in ${recommendedQuest.realm}. Are you ready to take it on?`,
      }
      return {
        text: responses[responseLength],
        category: "quest" as const,
        metadata: { recommendation: recommendedQuest.title, difficulty: recommendedQuest.difficulty },
      }
    }

    if (lower.includes("progress") || lower.includes("how am i doing")) {
      const weeklyQuests = completedQuests.filter(
        (q) => new Date(q.completedAt!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
      )

      const responses = {
        brief: `Week: ${weeklyQuests.length}, Today: ${completedToday.length}, Active: ${activeQuests.length}, Streak: ${player.streak}`,
        normal: `This week: ${weeklyQuests.length} quests, ${completedToday.length} today. ${activeQuests.length} active quests. Streak: ${player.streak} days.`,
        detailed: `Here's your comprehensive quest progress analysis, Hunter:

📊 **Weekly Performance:** ${weeklyQuests.length} quests completed
📅 **Today's Progress:** ${completedToday.length} quests completed  
📋 **Active Quests:** ${activeQuests.length} awaiting completion
🔥 **Current Streak:** ${player.streak} days

Your consistency is ${player.streak > 7 ? "exceptional - you're in the top tier of dedicated hunters" : player.streak > 3 ? "solid and building strong momentum" : "developing, and every day you're getting stronger"}. ${weeklyQuests.length > 10 ? "Your weekly output is outstanding!" : weeklyQuests.length > 5 ? "You're maintaining good productivity." : "Focus on small, consistent wins to build momentum."}`,
      }

      return {
        text: responses[responseLength],
        category: "analytics" as const,
        metadata: {
          weeklyQuests: weeklyQuests.length,
          todayQuests: completedToday.length,
          activeQuests: activeQuests.length,
        },
      }
    }

    return null
  }

  // Generate emotional support responses with length variations
  const generateEmotionalResponse = (lower: string) => {
    const reflections = getReflections()
    const recentReflection = reflections[0]

    if (lower.includes("support") || lower.includes("help") || lower.includes("down")) {
      const supportMessage = generatePersonalizedSupport()
      return {
        text: supportMessage,
        category: "emotional" as const,
        metadata: { supportType: "general", userMood: context.userMood },
      }
    }

    if (lower.includes("mood") || lower.includes("feeling")) {
      if (recentReflection) {
        const responses = {
          brief: `${recentReflection.mood}, ${recentReflection.motivationLevel}/10 motivation`,
          normal: `Recent mood: ${recentReflection.mood}, ${recentReflection.emotionalState}. Motivation: ${recentReflection.motivationLevel}/10. Emotions are temporary, growth is permanent.`,
          detailed: `Based on your recent reflection, you're experiencing ${recentReflection.mood} with ${recentReflection.emotionalState}. Your motivation level is ${recentReflection.motivationLevel}/10. 

Remember, Hunter, emotions are temporary but your growth is permanent. Every feeling you experience teaches us something valuable about your journey. ${recentReflection.motivationLevel < 5 ? "When motivation is low, focus on small, manageable tasks that build momentum." : "With good motivation levels, this is an excellent time to tackle challenging quests."} 

Your emotional awareness through reflection is a powerful tool for personal development. Keep tracking these patterns - they reveal insights about what energizes you and what drains you.`,
        }
        return {
          text: responses[responseLength],
          category: "emotional" as const,
          metadata: { mood: recentReflection.mood, motivation: recentReflection.motivationLevel },
        }
      } else {
        const responses = {
          brief: "Add reflection for guidance.",
          normal: "Add a reflection or diary entry for personalized emotional guidance.",
          detailed:
            "I'd love to understand your emotional state better and provide personalized guidance, Hunter. Consider adding a reflection or diary entry so I can analyze your emotional patterns and provide more specific support. Your feelings matter, and tracking them helps us both understand your journey better. Emotional intelligence is just as important as any other skill in your development as a Hunter.",
        }
        return {
          text: responses[responseLength],
          category: "emotional" as const,
          metadata: { needsReflection: true },
        }
      }
    }

    return null
  }

  // Generate analytics responses with length variations
  const generateAnalyticsResponse = (lower: string) => {
    const metrics = getPerformanceMetrics()
    const weeklyStats = getWeeklyStats()
    const monthlyProgress = getMonthlyProgress()

    if (lower.includes("performance") || lower.includes("analytics")) {
      const responses = {
        brief: `Week: ${weeklyStats.totalQuests} quests, ${weeklyStats.totalXP} XP. Month: ${monthlyProgress.achievementsUnlocked} achievements.`,
        normal: `📊 Week: ${weeklyStats.totalQuests} quests, ${weeklyStats.totalXP} XP, ${weeklyStats.averageMood.toFixed(1)}/10 mood
📈 Month: ${monthlyProgress.levelUps} levels, ${monthlyProgress.achievementsUnlocked} achievements
Consistency: ${weeklyStats.totalQuests > 10 ? "exceptional" : weeklyStats.totalQuests > 5 ? "solid" : "developing"}`,
        detailed: `Here's your comprehensive performance analysis, Hunter:

📊 **Weekly Overview:**
• Quests completed: ${weeklyStats.totalQuests}
• XP earned: ${weeklyStats.totalXP}
• Average mood: ${weeklyStats.averageMood.toFixed(1)}/10
• Most productive day: ${weeklyStats.mostProductiveDay}

📈 **Monthly Progress:**
• Level ups: ${monthlyProgress.levelUps}
• Achievements unlocked: ${monthlyProgress.achievementsUnlocked}
• Stat growth: ${
          Object.entries(monthlyProgress.statGrowth).length > 0
            ? Object.entries(monthlyProgress.statGrowth)
                .map(([stat, value]) => `${stat}: +${value}`)
                .join(", ")
            : "No stat changes recorded"
        }

🎯 **Performance Assessment:**
Your trajectory shows ${weeklyStats.totalQuests > 10 ? "exceptional consistency - you're operating at peak performance levels" : weeklyStats.totalQuests > 5 ? "solid consistency with room for optimization" : "developing patterns that need focus on building momentum"}. 

${weeklyStats.averageMood > 7 ? "Your high mood levels indicate you're in a positive growth phase." : weeklyStats.averageMood > 5 ? "Your mood levels are stable, providing a good foundation for growth." : "Consider focusing on activities that boost your emotional well-being."}`,
      }

      return {
        text: responses[responseLength],
        category: "analytics" as const,
        metadata: { metrics, weeklyStats, monthlyProgress },
      }
    }

    return null
  }

  // Generate achievement responses with length variations
  const generateAchievementResponse = (lower: string) => {
    const unlockedAchievements = achievements.filter((a) => a.unlocked)
    const lockedAchievements = achievements.filter((a) => !a.unlocked)

    if (lower.includes("achievement") || lower.includes("unlock")) {
      const recentAchievements = unlockedAchievements.filter(
        (a) => a.unlockedAt && new Date(a.unlockedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
      )

      if (recentAchievements.length > 0) {
        const responses = {
          brief: `🏆 ${recentAchievements.length} new achievement${recentAchievements.length > 1 ? "s" : ""}!`,
          normal: `🏆 ${recentAchievements.length} achievement${recentAchievements.length > 1 ? "s" : ""} this week: ${recentAchievements.map((a) => a.title).join(", ")}`,
          detailed: `🏆 Congratulations, Hunter! You've unlocked ${recentAchievements.length} achievement${recentAchievements.length > 1 ? "s" : ""} this week: ${recentAchievements.map((a) => a.title).join(", ")}. 

Your dedication is paying off in measurable ways! Each achievement represents a milestone in your journey and proves that your consistent efforts are creating real progress. These aren't just badges - they're evidence of your growth, discipline, and commitment to becoming the best version of yourself.

Keep this momentum going, Hunter. Your achievement rate shows you're operating at a high level of effectiveness.`,
        }
        return {
          text: responses[responseLength],
          category: "achievement" as const,
          metadata: { recentAchievements: recentAchievements.length },
        }
      }

      const nextAchievement = lockedAchievements.find((a) => {
        switch (a.requirement.type) {
          case "level":
            return player.level >= a.requirement.value - 1
          case "quests_completed":
            return completedQuests.length >= a.requirement.value - 5
          case "streak":
            return player.streak >= a.requirement.value - 3
          default:
            return false
        }
      })

      if (nextAchievement) {
        const responses = {
          brief: `Close to "${nextAchievement.title}"!`,
          normal: `Close to "${nextAchievement.title}". Keep pushing!`,
          detailed: `You're very close to unlocking "${nextAchievement.title}", Hunter! ${nextAchievement.description}. 

This achievement is within your reach, and earning it will be a significant milestone in your journey. Focus on the specific requirements and maintain your current momentum. Every step you take is bringing you closer to this goal. The satisfaction of unlocking it will be worth the effort you're putting in right now.

Keep pushing forward with determination!`,
        }
        return {
          text: responses[responseLength],
          category: "achievement" as const,
          metadata: { nextAchievement: nextAchievement.title },
        }
      }
    }

    return null
  }

  // Generate coaching responses with length variations
  const generateCoachingResponse = (lower: string) => {
    if (lower.includes("improve") || lower.includes("better") || lower.includes("advice")) {
      const coaching = generatePersonalizedCoaching()
      return {
        text: coaching,
        category: "coaching" as const,
        metadata: { coachingType: "improvement" },
      }
    }

    if (lower.includes("goal") || lower.includes("target")) {
      const responses = {
        brief: `Week: ${Math.max(3, Math.floor(player.level / 2))} quests. Month: Level ${player.level + 2}. Quarter: 30-day streak.`,
        normal: `Goals for Level ${player.level}:
🎯 Week: Maintain ${player.streak}-day streak, complete ${Math.max(3, Math.floor(player.level / 2))} quests
🎯 Month: Reach level ${player.level + 2}, unlock 2 achievements
🎯 Quarter: 30-day streak, master one realm
Which resonates most?`,
        detailed: `Let's set some powerful, achievable goals based on your current Level ${player.level} status and ${player.streak}-day streak, Hunter:

🎯 **Short-term Goals (1 week):**
• Maintain your current ${player.streak}-day streak for 7 more days
• Complete ${Math.max(3, Math.floor(player.level / 2))} quests (mix of easy and medium difficulty)
• Focus improvement efforts on your weakest stat area
• Establish a consistent daily routine that supports your growth

🎯 **Medium-term Goals (1 month):**
• Reach level ${player.level + 2} through consistent XP accumulation
• Unlock 2 new achievements by targeting specific requirements
• Establish a sustainable daily routine that you can maintain long-term
• Improve your average mood score through better self-care practices

🎯 **Long-term Goals (3 months):**
• Achieve and maintain a 30-day streak (the gold standard of consistency)
• Master one specific realm by completing 15+ quests in that area
• Develop a signature skill or area of expertise
• Build systems that make your growth automatic rather than effortful

Which timeframe resonates most with you right now? I can help you create specific action steps for any of these goals.`,
      }

      return {
        text: responses[responseLength],
        category: "coaching" as const,
        metadata: { goalSetting: true, timeframes: ["short", "medium", "long"] },
      }
    }

    return null
  }

  // Generate personalized support message with length variations
  const generatePersonalizedSupport = (): string => {
    const streak = player.streak
    const level = player.level
    const recentQuests = completedQuests.filter(
      (q) => new Date(q.completedAt!).getTime() > Date.now() - 24 * 60 * 60 * 1000,
    ).length

    if (context.userMood === "negative") {
      const responses = {
        brief: `Level ${level}${streak > 0 ? `, ${streak}-day streak` : ""} proves your strength. One step at a time.`,
        normal: `Difficult moments build strength, Hunter. Level ${level}${streak > 0 ? `, ${streak}-day streak` : ""} proves your resilience. One step at a time.`,
        detailed: `I hear you, Hunter, and I want you to know that difficult moments are an integral part of every hero's journey. What you're experiencing right now doesn't diminish your worth or your progress - it's actually part of what's building your character and resilience.

Remember, you've already proven your strength by reaching level ${level}${streak > 0 ? ` and maintaining a ${streak}-day streak` : ""}. These aren't just numbers - they represent real dedication, real effort, and real growth. This current challenge is temporary, but the resilience you're building by working through it is permanent.

Take it one small step at a time. You don't need to solve everything today. Just focus on the next small action you can take. I believe in you, and I'm here to support you every step of the way.`,
      }
      return responses[responseLength]
    }

    if (recentQuests === 0 && streak === 0) {
      const responses = {
        brief: `Every legend starts with one step. Choose a small quest today.`,
        normal: `Every legend starts with one step. Choose a small quest today. I'm here to help.`,
        detailed: `Every legend starts with a single step, Hunter. You don't need to be perfect - you just need to begin. The most important thing right now is to choose one small quest that you can complete today. It doesn't have to be big or impressive; it just needs to be something that moves you forward.

Your future self will thank you for starting now rather than waiting for the "perfect" moment. Small actions compound over time into extraordinary results. I'm here to support you every step of the way, and together we'll build the momentum you need to achieve your goals.

What's one small thing you could do right now to get started?`,
      }
      return responses[responseLength]
    }

    const responses = {
      brief: `Level ${level}${streak > 0 ? `, ${streak}-day streak` : ""} shows dedication. Trust the process.`,
      normal: `Level ${level} shows dedication${streak > 0 ? `, ${streak}-day streak proves consistency` : ""}. Trust the process, celebrate small wins.`,
      detailed: `You're doing better than you realize, Hunter. Your journey to level ${level} shows real dedication and commitment to your growth. ${streak > 0 ? `Your ${streak}-day streak proves your consistency and discipline.` : ""} These achievements didn't happen by accident - they're the result of your daily choices and efforts.

Trust the process you've established. Growth happens in the valleys as much as on the peaks, and every small win you celebrate builds the foundation for bigger victories. Your consistency is your superpower, and you're developing it more each day.

Remember to celebrate your progress, no matter how small it might seem. You're building something meaningful here.`,
    }
    return responses[responseLength]
  }

  // Generate personalized coaching with length variations
  const generatePersonalizedCoaching = (): string => {
    const realmPerformance = getRealmPerformance()
    const weakestRealm = Object.entries(realmPerformance).reduce((min, [realm, stats]) =>
      stats.questsCompleted < min.stats.questsCompleted ? { realm, stats } : min,
    )

    const strongestRealm = Object.entries(realmPerformance).reduce((max, [realm, stats]) =>
      stats.questsCompleted > max.stats.questsCompleted ? { realm, stats } : max,
    )

    const responses = {
      brief: `Strength: ${strongestRealm.realm}. Growth: ${weakestRealm.realm}. Focus consistency over intensity.`,
      normal: `💪 Strength: ${strongestRealm.realm} (${strongestRealm.stats.questsCompleted} quests)
🎯 Growth: ${weakestRealm.realm} (${weakestRealm.stats.questsCompleted} quests)
Tips: Batch similar quests, use ${player.streak}-day momentum, consistency over intensity.`,
      detailed: `Based on your comprehensive performance analysis, Hunter, here's your personalized coaching:

💪 **Your Strength: ${strongestRealm.realm}** (${strongestRealm.stats.questsCompleted} quests completed)
You excel in this realm! This is your zone of genius where you naturally perform well. Consider taking on leadership challenges here, mentoring others, or tackling the most difficult quests in this area. Your strength here can be leveraged to build confidence for other areas.

🎯 **Growth Opportunity: ${weakestRealm.realm}** (${weakestRealm.stats.questsCompleted} quests completed)
This realm has huge potential for you. The gap between your strongest and weakest areas represents your biggest opportunity for balanced growth. Start with easy quests here to build momentum and confidence. Don't try to match your strongest realm immediately - focus on consistent small improvements.

🔥 **Optimization Strategies:**
• Batch similar quests together for maximum efficiency and flow state
• Leverage your current ${player.streak}-day streak momentum - you're already in a winning rhythm
• Focus on consistency over intensity - small daily actions compound into massive results
• Celebrate progress, not just perfection - every step forward matters
• Use your strong realm confidence to tackle weak realm challenges

Your level ${player.level} status shows you have a solid foundation. Now let's build the empire systematically!`,
    }

    return responses[responseLength]
  }

  // Enhanced proactive comment generator with length variations
  const generateEnhancedProactiveComment = (stats: any, last: any) => {
    // Streak achievements
    if (stats.streak > (last.streak || 0)) {
      if (stats.streak === 7) {
        const responses = {
          brief: "🔥 7-day streak!",
          normal: "🔥 7-day streak! Consistency is your superpower, Hunter.",
          detailed:
            "🔥 INCREDIBLE! You've achieved a 7-day streak, Hunter! This is where legends are born. Your consistency is becoming your superpower. The System recognizes your dedication!",
        }
        return {
          text: responses[responseLength],
          category: "achievement" as const,
          metadata: { milestone: "week_streak", streak: stats.streak },
        }
      }
      if (stats.streak === 30) {
        const responses = {
          brief: "🏆 30-day streak! Legendary!",
          normal: "🏆 30-day streak! Legendary status achieved, Hunter.",
          detailed:
            "🏆 LEGENDARY STATUS ACHIEVED! 30-day streak unlocked! You've transcended ordinary limits, Hunter. Your discipline is now a force of nature. The System bows to your commitment!",
        }
        return {
          text: responses[responseLength],
          category: "achievement" as const,
          metadata: { milestone: "month_streak", streak: stats.streak },
        }
      }
      if (stats.streak % 10 === 0) {
        const responses = {
          brief: `⚡ ${stats.streak}-day milestone!`,
          normal: `⚡ ${stats.streak}-day milestone! Small actions, extraordinary results.`,
          detailed: `⚡ ${stats.streak}-DAY STREAK MILESTONE! Your consistency is reshaping reality, Hunter. Each day you prove that small actions create extraordinary results!`,
        }
        return {
          text: responses[responseLength],
          category: "achievement" as const,
          metadata: { milestone: "streak_multiple", streak: stats.streak },
        }
      }
      const responses = {
        brief: `🔥 ${stats.streak}-day streak!`,
        normal: `🔥 ${stats.streak}-day streak! Momentum building.`,
        detailed: `🔥 Streak extended to ${stats.streak} days! Your momentum is building, Hunter. Consistency is your secret weapon!`,
      }
      return {
        text: responses[responseLength],
        category: "general" as const,
        metadata: { streak: stats.streak },
      }
    }

    // Level ups with personalized messages
    if (stats.level > (last.level || 0)) {
      const levelMessages = {
        brief: {
          5: "🌟 Level 5!",
          10: "⚡ Level 10!",
          25: "🏆 Level 25!",
          50: "👑 Level 50!",
          100: "🌌 Level 100!",
        },
        normal: {
          5: "🌟 Level 5! Real journey begins now.",
          10: "⚡ Level 10! Elite territory, Hunter.",
          25: "🏆 Level 25! Top tier achieved.",
          50: "👑 Level 50! Legendary status.",
          100: "🌌 Level 100! Transcendent Hunter.",
        },
        detailed: {
          5: "🌟 Level 5 achieved! You've proven your commitment, Hunter. The real journey begins now!",
          10: "⚡ Level 10 unlocked! Double digits - you're entering elite territory, Hunter!",
          25: "🏆 Level 25 reached! You're in the top tier now, Hunter. Your dedication is inspiring!",
          50: "👑 Level 50 - LEGENDARY STATUS! You've achieved what few dare to attempt, Hunter!",
          100: "🌌 Level 100 - TRANSCENDENT HUNTER! You've broken through all limits!",
        },
      }

      const levelText =
        levelMessages[responseLength][stats.level as keyof (typeof levelMessages)[typeof responseLength]] ||
        (responseLength === "brief"
          ? `🎉 Level ${stats.level}!`
          : responseLength === "normal"
            ? `🎉 Level ${stats.level}! Power grows, Hunter.`
            : `🎉 Level ${stats.level} achieved! Your power grows, Hunter. Each level is a testament to your dedication!`)

      return {
        text: levelText,
        category: "achievement" as const,
        metadata: { milestone: "level_up", level: stats.level },
      }
    }

    // XP milestones
    if (stats.xp > (last.xp || 0)) {
      const xpGained = stats.xp - (last.xp || 0)
      if (xpGained >= 100) {
        const responses = {
          brief: `⚡ +${xpGained} XP!`,
          normal: `⚡ +${xpGained} XP! Total: ${stats.xp} XP.`,
          detailed: `⚡ Massive XP gain! +${xpGained} XP earned! Your total power is now ${stats.xp} XP. The System trembles at your growth rate!`,
        }
        return {
          text: responses[responseLength],
          category: "general" as const,
          metadata: { xpGained, totalXp: stats.xp },
        }
      }
    }

    // Achievement unlocks
    if (stats.achievements > (last.achievements || 0)) {
      const newAchievements = stats.achievements - (last.achievements || 0)
      const responses = {
        brief: `🏆 ${newAchievements} new achievement${newAchievements > 1 ? "s" : ""}!`,
        normal: `🏆 ${newAchievements} new achievement${newAchievements > 1 ? "s" : ""}! Legend grows.`,
        detailed: `🏆 ${newAchievements} new achievement${newAchievements > 1 ? "s" : ""} unlocked! Your legend grows, Hunter. Each achievement is a chapter in your epic story!`,
      }
      return {
        text: responses[responseLength],
        category: "achievement" as const,
        metadata: { newAchievements, totalAchievements: stats.achievements },
      }
    }

    // Mood improvements
    if (stats.mood > (last.mood || 0) + 1) {
      const responses = {
        brief: `😊 Mood rising: ${stats.mood.toFixed(1)}/10`,
        normal: `😊 Mood rising: ${stats.mood.toFixed(1)}/10. Mental strength building.`,
        detailed: `😊 Your mood is rising, Hunter! Current average: ${stats.mood.toFixed(1)}/10. Your emotional resilience is strengthening. The mind is your greatest weapon!`,
      }
      return {
        text: responses[responseLength],
        category: "emotional" as const,
        metadata: { mood: stats.mood, improvement: true },
      }
    }

    return null
  }

  // Enhanced microphone click handler with proper state management
  const handleMicClick = () => {
    if (!supportsSpeech || !recognitionRef.current) return

    // If currently listening, stop recognition
    if (recognitionState === "listening") {
      try {
        recognitionRef.current.stop()
        setRecognitionState("stopping")
      } catch (e) {
        console.error("Error stopping recognition:", e)
        setRecognitionState("idle")
        setIsListening(false)
      }
      return
    }

    // If idle, start recognition
    if (recognitionState === "idle") {
      try {
        setRecognitionState("starting")
        recognitionRef.current.start()
      } catch (e) {
        console.error("Error starting recognition:", e)
        setRecognitionState("idle")
        setIsListening(false)

        // Show error message to user
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "agent",
            text: "I'm having trouble with voice recognition right now. Please try typing your message instead.",
            timestamp: new Date(),
            category: "general",
          },
        ])
      }
    }
  }

  // Toggle wake word detection
  const toggleWakeWord = () => {
    setWakeWordEnabled(!wakeWordEnabled)

    if (wakeWordEnabled && wakeRecognitionRef.current && wakeRecognitionState === "listening") {
      try {
        wakeRecognitionRef.current.stop()
        setWakeRecognitionState("stopping")
      } catch (e) {
        console.error("Error stopping wake recognition:", e)
      }
    } else if (!wakeWordEnabled) {
      wakeErrorCountRef.current = 0
      if (wakeRecognitionState === "idle" && !show) {
        startWakeRecognition()
      }
    }
  }

  // Don't render during SSR
  if (!mounted) return null

  const contextualPrompts = getContextualPrompts(player, completedQuests, context)

  return (
    <>
      {/* Enhanced floating chat button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full p-4 shadow-2xl flex items-center gap-2"
          onClick={() => setShow((s) => !s)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isWakeListening ? "0 0 20px rgba(6, 182, 212, 0.5)" : "0 10px 25px rgba(0, 0, 0, 0.3)",
          }}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 50,
            width: "auto",
            maxWidth: "90vw",
            ...(typeof window !== "undefined" && window.innerWidth < 640
              ? {
                  bottom: "1rem",
                  right: "1rem",
                  padding: "0.75rem 1.25rem",
                  fontSize: "1rem",
                }
              : {}),
          }}
        >
          <Sparkles className="w-6 h-6" />
          <span className="font-bold">Arise</span>
          {isWakeListening && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
            />
          )}
        </motion.button>
      </div>

      {/* Enhanced chat window */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-96 max-w-[95vw] max-h-[85vh] bg-gradient-to-b from-gray-900/98 to-gray-800/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-cyan-400/30 z-50 flex flex-col"
            style={{
              ...(typeof window !== "undefined" && window.innerWidth < 640
                ? {
                    bottom: "4.5rem",
                    right: "0.5rem",
                    left: "0.5rem",
                    width: "auto",
                    maxWidth: "98vw",
                    minWidth: 0,
                  }
                : {}),
            }}
          >
            {/* Enhanced header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-400/30 bg-gradient-to-r from-cyan-900/50 to-blue-900/50">
              <div className="flex items-center gap-3">
                {agentAvatar}
                <div>
                  <span className="font-bold text-cyan-400">{agentName}</span>
                  <div className="text-xs text-cyan-300/70">Enhanced AI Companion</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className="p-1 rounded-lg hover:bg-cyan-800/50 transition-colors"
                  title={speechEnabled ? "Disable speech" : "Enable speech"}
                >
                  {speechEnabled ? (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={toggleWakeWord}
                  className={`p-1 rounded-lg hover:bg-cyan-800/50 transition-colors ${wakeWordEnabled ? "text-cyan-400" : "text-gray-400"}`}
                  title={wakeWordEnabled ? "Disable wake word" : "Enable wake word"}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 rounded-lg hover:bg-cyan-800/50 transition-colors text-cyan-400"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShow(false)}
                  className="p-1 rounded-lg hover:bg-cyan-800/50 transition-colors"
                >
                  <span className="text-cyan-400">×</span>
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-cyan-400/30 bg-gradient-to-r from-gray-800/80 to-gray-700/80"
                >
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-cyan-400 mb-3">Response Settings</h3>

                    {/* Response Length Setting */}
                    <div className="space-y-2">
                      <label className="text-xs text-cyan-300/70">Response Length</label>
                      <div className="flex gap-2">
                        {(["brief", "normal", "detailed"] as ResponseLength[]).map((length) => (
                          <button
                            key={length}
                            onClick={() => setResponseLength(length)}
                            className={`px-3 py-1 rounded-lg text-xs transition-all ${
                              responseLength === length
                                ? "bg-cyan-500 text-white"
                                : "bg-gray-700 text-cyan-300 hover:bg-gray-600"
                            }`}
                          >
                            {length.charAt(0).toUpperCase() + length.slice(1)}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-cyan-300/50">
                        {responseLength === "brief" && "Concise, 1-2 sentences"}
                        {responseLength === "normal" && "Balanced, key information"}
                        {responseLength === "detailed" && "Comprehensive, with examples"}
                      </div>
                    </div>

                    {/* Voice Settings */}
                    <div className="space-y-2">
                      <label className="text-xs text-cyan-300/70">Voice Settings</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-cyan-300">Speech Rate</span>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={voiceSettings.rate}
                            onChange={(e) =>
                              setVoiceSettings((prev) => ({ ...prev, rate: Number.parseFloat(e.target.value) }))
                            }
                            className="w-20 accent-cyan-400"
                          />
                          <span className="text-xs text-cyan-300/70 w-8">{voiceSettings.rate.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-cyan-300">Pitch</span>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={voiceSettings.pitch}
                            onChange={(e) =>
                              setVoiceSettings((prev) => ({ ...prev, pitch: Number.parseFloat(e.target.value) }))
                            }
                            className="w-20 accent-cyan-400"
                          />
                          <span className="text-xs text-cyan-300/70 w-8">{voiceSettings.pitch.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-cyan-300">Volume</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={voiceSettings.volume}
                            onChange={(e) =>
                              setVoiceSettings((prev) => ({ ...prev, volume: Number.parseFloat(e.target.value) }))
                            }
                            className="w-20 accent-cyan-400"
                          />
                          <span className="text-xs text-cyan-300/70 w-8">{voiceSettings.volume.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Commands */}
                    <div className="space-y-2">
                      <label className="text-xs text-cyan-300/70">Voice Commands</label>
                      <div className="text-xs text-cyan-300/50 space-y-1">
                        <div>"Brief mode" - Switch to brief responses</div>
                        <div>"Normal mode" - Switch to normal responses</div>
                        <div>"Detailed mode" - Switch to detailed responses</div>
                        <div>"Clear chat" - Reset conversation</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced message area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "agent" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm relative ${
                      msg.sender === "agent"
                        ? "bg-gradient-to-r from-cyan-900/80 to-blue-900/80 text-cyan-100 border border-cyan-400/20"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    }`}
                  >
                    {msg.category && msg.sender === "agent" && (
                      <div className="flex items-center gap-1 mb-1 text-xs text-cyan-300/70">
                        {msg.category === "emotional" && <Heart className="w-3 h-3" />}
                        {msg.category === "analytics" && <TrendingUp className="w-3 h-3" />}
                        {msg.category === "achievement" && <Award className="w-3 h-3" />}
                        {msg.category === "quest" && <Target className="w-3 h-3" />}
                        {msg.category === "coaching" && <Brain className="w-3 h-3" />}
                        <span className="capitalize">{msg.category}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 text-cyan-100 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Enhanced input area */}
            <div className="p-4 border-t border-cyan-400/30 bg-gradient-to-r from-gray-800/80 to-gray-700/80">
              <form
                className="flex gap-2 mb-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend(input)
                }}
              >
                <input
                  className="flex-1 rounded-xl px-4 py-3 bg-gray-900/80 text-white border border-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent placeholder-gray-400"
                  placeholder="Ask me anything, Hunter..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading || isListening}
                />
                <motion.button
                  type="button"
                  onClick={handleMicClick}
                  className={`bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-800 hover:to-blue-800 text-white rounded-xl px-4 py-3 flex items-center transition-all ${
                    isListening ? "ring-2 ring-cyan-400 animate-pulse" : ""
                  }`}
                  whileTap={{ scale: 0.95 }}
                  title={supportsSpeech ? (isListening ? "Stop listening" : "Voice input") : "Speech not supported"}
                  disabled={
                    !supportsSpeech || isLoading || recognitionState === "starting" || recognitionState === "stopping"
                  }
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19v4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 23h8" />
                  </svg>
                </motion.button>
                <motion.button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl px-4 py-3 flex items-center transition-all"
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </form>

              {/* Enhanced contextual prompts */}
              <div className="flex flex-wrap gap-2">
                {contextualPrompts.map((prompt, i) => (
                  <motion.button
                    key={i}
                    className="bg-gradient-to-r from-cyan-700/40 to-blue-700/40 hover:from-cyan-700/80 hover:to-blue-700/80 text-cyan-100 rounded-lg px-3 py-2 text-xs transition-all border border-cyan-400/20"
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>

              {/* Status indicators */}
              <div className="mt-2 space-y-1">
                {/* Context indicator */}
                {context.conversationDepth > 0 && (
                  <div className="text-xs text-cyan-300/50 flex items-center gap-2">
                    <Brain className="w-3 h-3" />
                    <span>
                      Context: {context.lastTopics.slice(0, 2).join(", ")} • Mood: {context.userMood}
                    </span>
                  </div>
                )}

                {/* Response length and wake word status */}
                <div className="flex items-center justify-between text-xs text-cyan-300/50">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">Response: {responseLength}</span>
                  </div>
                  {supportsSpeech && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        Wake word:{" "}
                        {wakeWordEnabled ? (
                          <span className="text-green-400">Enabled</span>
                        ) : (
                          <span className="text-gray-400">Disabled</span>
                        )}
                        {wakeWordEnabled && wakeErrorCountRef.current > 0 && (
                          <span className="text-yellow-400"> (Retrying...)</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
