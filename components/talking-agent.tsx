"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Bot, Send, Loader2 } from "lucide-react"
import { usePlayerStore } from "@/stores/player-store"
import { getGeminiInsight } from "@/lib/gemini-api"

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
}

const agentName = "Arise"
const agentAvatar = <Bot className="w-8 h-8 text-cyan-400 animate-bounce" />

const SUGGESTED_PROMPTS = [
  "How am I doing this week?",
  "Any tips to improve my streak?",
  "What do my mood trends say?",
  "How can I earn more XP?",
]

export function TalkingAgent() {
  const {
    player,
    getPerformanceMetrics,
    getMoodTrends,
    getWeeklyStats,
    getMonthlyProgress,
    completedQuests,
    quests,
  } = usePlayerStore()

  const [messages, setMessages] = useState<Message[]>([{
    sender: "agent",
    text: `Hi! I'm ${agentName}, your personal RPG assistant. I'll comment on your stats and answer your questions!`
  }])
  const [input, setInput] = useState("")
  const [show, setShow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const lastStats = useRef<any>({})
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)
  const supportsSpeech = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  const supportsTTS = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [isWakeListening, setIsWakeListening] = useState(false)
  const wakeRecognitionRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Proactive feedback when stats change
  useEffect(() => {
    const stats = {
      streak: player.streak,
      xp: player.totalXp,
      mood: getWeeklyStats().averageMood,
      quests: completedQuests.length,
      level: player.level,
    }
    // Compare with last stats
    if (JSON.stringify(stats) !== JSON.stringify(lastStats.current)) {
      const feedback = generateProactiveComment(stats, lastStats.current)
      if (feedback) {
        setMessages((msgs) => [...msgs, { sender: "agent", text: feedback }])
      }
      lastStats.current = stats
    }
    // Scroll to bottom on new message
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [player.streak, player.totalXp, player.level, completedQuests.length, getWeeklyStats().averageMood])

  // Speak agent messages aloud
  useEffect(() => {
    if (!supportsTTS) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.sender === 'agent' && lastMsg.text) {
      const utter = new window.SpeechSynthesisUtterance(lastMsg.text)
      utter.rate = 1.05
      utter.pitch = 1.1
      utter.lang = 'en-US'
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    }
  }, [messages, supportsTTS])

  // Speech recognition setup
  useEffect(() => {
    if (!supportsSpeech) return
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-US'
        recognition.interimResults = false
        recognition.maxAlternatives = 1
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsListening(false)
          handleSend(transcript)
        }
        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)
        recognitionRef.current = recognition
      }
    }
  }, [supportsSpeech])

  // Wake word: Listen for 'Arise' when chat is closed
  useEffect(() => {
    if (!supportsSpeech) return
    if (show) {
      // Stop wake recognition if chat is open
      wakeRecognitionRef.current?.stop?.()
      setIsWakeListening(false)
      return
    }
    // Start wake recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition && !wakeRecognitionRef.current) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.continuous = true
      recognition.onresult = (event: any) => {
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase()
          if (transcript.includes('arise')) {
            recognition.stop()
            setIsWakeListening(false)
            setShow(true)
            setTimeout(() => handleMicClick(), 400) // Start active listening after opening
            break
          }
        }
      }
      recognition.onerror = () => setIsWakeListening(false)
      recognition.onend = () => setIsWakeListening(false)
      wakeRecognitionRef.current = recognition
    }
    if (!isWakeListening && wakeRecognitionRef.current) {
      try {
        wakeRecognitionRef.current.start()
        setIsWakeListening(true)
      } catch {}
    }
    return () => {
      wakeRecognitionRef.current?.stop?.()
      setIsWakeListening(false)
    }
  }, [supportsSpeech, show])

  // Handle user input
  const handleSend = async (text: string) => {
    if (!text.trim()) return
    // Stop speech if user says 'stop' or 'be quiet'
    const lowerText = text.trim().toLowerCase()
    if ((lowerText === 'stop' || lowerText === 'be quiet') && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setMessages((msgs) => [...msgs, { sender: "user", text }])
      setMessages((msgs) => [...msgs, { sender: "agent", text: "Speech stopped." }])
      setInput("")
      setIsLoading(false)
      return
    }
    setMessages((msgs) => [...msgs, { sender: "user", text }])
    setInput("")
    setIsLoading(true)
    // Agent responds
    let reply = generateAgentReply(text)
    if (reply === "gemini") {
      // Call Gemini API for advanced insight
      try {
        // If not stats/analytics, call without playerProfile
        const statsPhrases = [
          "how am i doing", "show my dashboard", "what's my progress", "how's my performance", "how many quests have i completed", "what's my current streak", "how much xp do i have", "what's my level", "show my achievements", "how's my mood", "show my stats", "show my analytics", "how did i do this month", "what's my best day", "how many quests left", "what's my realm performance", "how's my motivation", "give me a summary", "how did i improve", "what's my reflection streak", "mood", "streak", "xp", "level", "quest", "progress", "performance", "achievements", "stats", "analytics", "reflection", "summary", "motivation", "realm",
          // Name/profile-related
          "what's my name", "who am i", "hunter name", "my name", "profile", "player name", "show my name", "display my name", "hunter profile"
        ]
        const isStatsRelated = statsPhrases.some(phrase => lowerText.includes(phrase))
        if (isStatsRelated) {
          console.log('[TalkingAgent] Sending player to Gemini:', player)
        }
        const geminiReply = await getGeminiInsight(text, isStatsRelated ? player : undefined)
        setMessages((msgs) => [...msgs, { sender: "agent", text: geminiReply }])
      } catch (e) {
        setMessages((msgs) => [...msgs, { sender: "agent", text: "Sorry, I couldn't get a real-time insight right now." }])
      }
    } else {
      setMessages((msgs) => [...msgs, { sender: "agent", text: reply }])
    }
    setIsLoading(false)
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Proactive comment generator
  function generateProactiveComment(stats: any, last: any) {
    if (!last.streak || stats.streak > last.streak) {
      return `🔥 Awesome! Your streak is now ${stats.streak} days! Keep it up!`
    }
    if (stats.xp > (last.xp || 0)) {
      return `⚡ You just earned more XP! Total XP: ${stats.xp}`
    }
    if (stats.level > (last.level || 0)) {
      return `🏆 Level up! You reached level ${stats.level}!`
    }
    if (stats.mood > (last.mood || 0)) {
      return `😊 Your average mood is improving! Current: ${stats.mood.toFixed(1)}/10`
    }
    if (stats.quests > (last.quests || 0)) {
      return `✅ Another quest completed! Total: ${stats.quests}`
    }
    return null
  }

  // Simple agent reply logic
  function generateAgentReply(text: string) {
    const lower = text.toLowerCase()
    // Quests
    if (lower.includes("quest")) {
      if (completedQuests.length === 0) {
        return `Hunter, you have yet to embark on your first quest. The System awaits your first step. Accept your destiny!`
      } else if (completedQuests.length < 5) {
        return `You have completed ${completedQuests.length} quest${completedQuests.length > 1 ? "s" : ""}. Every journey begins with a single step. Keep going, Hunter!`
      } else if (completedQuests.length < 20) {
        return `Impressive, Hunter! You've conquered ${completedQuests.length} quests. The System acknowledges your growth.`
      } else {
        return `Legendary! You have completed ${completedQuests.length} quests. Your name echoes through the Gates. Continue your ascent!`
      }
    }
    // Streak
    if (lower.includes("streak")) {
      if (player.streak === 0) {
        return `No active streak detected. Begin your daily quests to ignite your streak, Hunter!`
      } else if (player.streak < 5) {
        return `Streak initiated: ${player.streak} day${player.streak > 1 ? "s" : ""}. Consistency is the mark of a true Hunter.`
      } else if (player.streak < 20) {
        return `Impressive! Your current streak is ${player.streak} days. The System is pleased with your dedication.`
      } else {
        return `Unstoppable! Your streak is ${player.streak} days. You are a force within the System.`
      }
    }
    // XP
    if (lower.includes("xp")) {
      if (player.totalXp < 100) {
        return `You have ${player.totalXp} XP. Every quest brings you closer to greatness. Accumulate more to level up!`
      } else if (player.totalXp < 1000) {
        return `Current XP: ${player.totalXp}. Your power grows steadily, Hunter. Continue your ascent.`
      } else {
        return `Astounding! You have amassed ${player.totalXp} XP. The System recognizes your relentless pursuit of strength.`
      }
    }
    // Level
    if (lower.includes("level")) {
      if (player.level === 1) {
        return `You are Level 1. Every legend starts somewhere. Begin your journey, Hunter!`
      } else if (player.level < 10) {
        return `Current Level: ${player.level}. The System observes your steady progress. Keep leveling up!`
      } else {
        return `Hunter, you have reached Level ${player.level}. Your legend grows. The System is watching.`
      }
    }
    // Mood
    if (lower.includes("mood")) {
      const mood = getWeeklyStats().averageMood
      if (mood >= 8) {
        return `Your average mood this week is ${mood.toFixed(1)}/10. Your spirit is radiant, Hunter! Use this energy to conquer greater challenges.`
      } else if (mood >= 5) {
        return `Your average mood this week is ${mood.toFixed(1)}/10. Maintain your resolve, Hunter. The System believes in your potential.`
      } else {
        return `Your average mood this week is ${mood.toFixed(1)}/10. The path is difficult, but every Hunter faces trials. Reflect, recover, and rise again.`
      }
    }
    // Name
    if (lower.includes("name") || lower.includes("who am i") || lower.includes("hunter name") || lower.includes("player name") || lower.includes("profile")) {
      return `Hunter Name: ${player.name || "(not set)"}. This is your identity within the System. Wield it with pride.`
    }
    // For anything else, use Gemini API
    return "gemini"
  }

  const handleMicClick = () => {
    if (!supportsSpeech) return
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  // Don't render during SSR
  if (!mounted) return null

  return (
    <>
      {/* Floating chat button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg flex items-center gap-2 animate-pulse"
          onClick={() => setShow((s) => !s)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 50,
            width: 'auto',
            maxWidth: '90vw',
            ...(typeof window !== 'undefined' && window.innerWidth < 640 ? { bottom: '1rem', right: '1rem', padding: '0.75rem 1.25rem', fontSize: '1rem' } : {})
          }}
        >
          <Sparkles className="w-6 h-6" />
          <span className="font-bold">Arise</span>
        </button>
      </div>
      {/* Chat window */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-24 right-6 w-80 max-w-[95vw] max-h-[80vh] bg-gray-900/95 rounded-xl shadow-2xl border border-cyan-400 z-50 flex flex-col"
            style={{
              ...(typeof window !== 'undefined' && window.innerWidth < 640 ? {
                bottom: '4.5rem',
                right: '0.5rem',
                left: '0.5rem',
                width: 'auto',
                maxWidth: '98vw',
                minWidth: 0
              } : {})
            }}
          >
            <div className="flex items-center gap-3 p-4 border-b border-cyan-400/30">
              {agentAvatar}
              <span className="font-bold text-cyan-400">{agentName}</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "agent" ? "justify-start" : "justify-end"}`}>
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${msg.sender === "agent" ? "bg-cyan-900/80 text-cyan-100" : "bg-cyan-500 text-white"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-3 py-2 bg-cyan-900/80 text-cyan-100 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-cyan-400/30 bg-gray-800/80">
              <form
                className="flex gap-2"
                onSubmit={e => {
                  e.preventDefault()
                  handleSend(input)
                }}
              >
                <input
                  className="flex-1 rounded-lg px-3 py-2 bg-gray-900 text-white border border-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isLoading || isListening}
                />
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg px-3 py-2 flex items-center ${isListening ? 'animate-pulse' : ''}`}
                  title={supportsSpeech ? (isListening ? 'Listening...' : 'Speak') : 'Speech recognition not supported'}
                  disabled={!supportsSpeech || isLoading}
                  style={{ outline: isListening ? '2px solid #06b6d4' : undefined }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18v2m0 0h3m-3 0H9m6-2a6 6 0 10-12 0 6 6 0 0012 0zm-6-6v6" /></svg>
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg px-3 py-2 flex items-center"
                  disabled={isLoading}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              {/* Suggested prompts */}
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    className="bg-cyan-700/40 hover:bg-cyan-700/80 text-cyan-100 rounded px-2 py-1 text-xs"
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
