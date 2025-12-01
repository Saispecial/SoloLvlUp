"use client"

import type React from "react"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { generateQuests } from "@/lib/gemini-api"
import { usePlayerStore } from "@/stores/player-store"
import { MobileNavigation } from "./mobile-navigation"
import { ResponsiveLayout } from "./responsive-layout"
import { EnhancedDashboard } from "./enhanced-dashboard"
import { QuestForm } from "./quest-form"
import { AchievementsPanel } from "./achievements-panel"
import { StatsPanel } from "./stats-panel"
import { SettingsPage } from "./settings-page"
import { MobileQuestCard } from "./mobile-quest-card"
import { ResponsiveCard } from "./responsive-card"
import { ParticleBackground } from "./particle-background"
import { FloatingElements } from "./floating-elements"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { motion } from "framer-motion"

import { Plus, Sparkles, Zap } from "lucide-react"
import type { Quest } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const Dashboard = forwardRef(function Dashboard(props, ref) {
  const {
    player,
    quests,
    completedQuests,
    achievements,
    currentReflection,
    reflections = [],
    addQuests,
    completeQuest,
    deleteQuest,
    editQuest,
    resetPlayer,
    setReflection,
    addCustomAttribute,
    updatePlayerName,
    updateTheme,
    getReflections,
  } = usePlayerStore()

  const [activeTab, setActiveTab] = useState("dashboard")
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingAriseQuests, setIsGeneratingAriseQuests] = useState(false)
  const [motivation, setMotivation] = useState("")
  const [emotionalGuidance, setEmotionalGuidance] = useState("")
  const [newAttributeName, setNewAttributeName] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [mood, setMood] = useState("")
  const [emotionalState, setEmotionalState] = useState("")
  const [currentChallenges, setCurrentChallenges] = useState("")
  const [motivationLevel, setMotivationLevel] = useState("")
  const [reflectionError, setReflectionError] = useState("")

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === "undefined") return
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    if (typeof document !== "undefined") {
      document.documentElement.className = `theme-${player.theme}`
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [player.theme])

  const generateNewQuests = async () => {
    setIsGenerating(true)
    try {
      const response = await generateQuests(player, currentReflection || undefined)
      addQuests(response.quests)
      setMotivation(response.suggestions.motivation)
      setEmotionalGuidance(response.suggestions.emotionalGuidance)
    } catch (err) {
      console.error("Quest generation failed:", err)
      setMotivation("Unable to generate quests right now, please try again later.")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAriseQuests = async () => {
    setIsGeneratingAriseQuests(true)
    try {
      const res = await fetch("/api/arise-quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player }),
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const response = await res.json()
      addQuests(response.quests)
      setMotivation(response.suggestions.motivation)
      setEmotionalGuidance(response.suggestions.emotionalGuidance)
    } catch (err) {
      console.error("Arise Quests generation failed:", err)
      setMotivation("Unable to generate Arise Quests right now, please try again later.")
    } finally {
      setIsGeneratingAriseQuests(false)
    }
  }

  const handleQuestSubmit = (questData: Omit<Quest, "id" | "completed" | "createdAt">) => {
    if (editingQuest) {
      editQuest(editingQuest.id, questData)
      setEditingQuest(null)
    } else {
      addQuests([questData])
    }
    setShowQuestForm(false)
  }

  const activeQuests = quests.filter((q) => !q.completed)
  console.log("[Dashboard] Current quests:", quests)

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mood || !emotionalState || !currentChallenges || !motivationLevel) {
      setReflectionError("Please fill in all fields.")
      return
    }
    setReflectionError("")
    setReflection({ mood, emotionalState, currentChallenges, motivationLevel })
    setMood("")
    setEmotionalState("")
    setCurrentChallenges("")
    setMotivationLevel("")
  }

  useImperativeHandle(ref, () => ({
    setActiveTab,
    generateNewQuests,
    setShowQuestForm,
    setEditingQuest,
    setReflection,
    handleQuestSubmit,
    handleReflectionSubmit,
  }))

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <EnhancedDashboard player={player} quests={quests} achievements={achievements} />

      case "quests":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-4 ${isMobile ? "pb-24" : ""}`}
          >
            {/* Header */}
            <ResponsiveCard
              mobileClassName="mx-4"
              className="bg-gradient-to-r from-themed-primary/20 to-themed-accent/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-themed-text">Active Quests ({activeQuests.length})</h2>
                  <p className="text-sm text-themed-text opacity-60">Complete quests to earn XP and level up</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"
                    onClick={() => {
                      setEditingQuest(null)
                      setShowQuestForm(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {isMobile ? "New" : "New Quest"}
                  </button>
                  <button
                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
                    disabled={isGenerating}
                    onClick={generateNewQuests}
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? "Generating..." : isMobile ? "AI" : "AI Quests"}
                  </button>
                  <button
                    className="btn-accent flex items-center gap-2 text-sm px-4 py-2"
                    disabled={isGeneratingAriseQuests}
                    onClick={generateAriseQuests}
                  >
                    <Zap className="h-4 w-4" />
                    {isGeneratingAriseQuests ? "Generating..." : "Arise Quests"}
                  </button>
                </div>
              </div>
            </ResponsiveCard>

            {/* Motivation Messages */}
            {motivation && (
              <ResponsiveCard mobileClassName="mx-4" className="bg-themed-primary/10 border-themed-primary/30">
                <p className="text-themed-primary text-sm">{motivation}</p>
              </ResponsiveCard>
            )}

            {emotionalGuidance && (
              <ResponsiveCard mobileClassName="mx-4" className="bg-themed-accent/10 border-themed-accent/30">
                <p className="text-themed-accent text-sm font-medium">Guidance:</p>
                <p className="text-themed-accent text-sm">{emotionalGuidance}</p>
              </ResponsiveCard>
            )}

            {/* Quest Grid */}
            <div className={`${isMobile ? "space-y-4 px-4" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}`}>
              {activeQuests.map((quest) =>
                isMobile ? (
                  <MobileQuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={completeQuest}
                    onDelete={deleteQuest}
                    onEdit={(q) => {
                      setEditingQuest(q)
                      setShowQuestForm(true)
                    }}
                  />
                ) : (
                  <ResponsiveCard key={quest.id} className="quest-card">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-themed-text">{quest.title}</h3>
                      <span className="text-cyan-400 font-mono">+{quest.xp} XP</span>
                    </div>
                    <p className="text-sm text-themed-text opacity-80 mb-3">{quest.description}</p>
                    <div className="flex gap-2">
                      <button className="btn-primary flex-1 text-sm py-2" onClick={() => completeQuest(quest.id)}>
                        Complete
                      </button>
                      <button
                        className="btn-secondary text-sm px-3 py-2"
                        onClick={() => {
                          setEditingQuest(quest)
                          setShowQuestForm(true)
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn-secondary text-sm px-3 py-2" onClick={() => deleteQuest(quest.id)}>
                        Delete
                      </button>
                    </div>
                  </ResponsiveCard>
                ),
              )}
            </div>

            {activeQuests.length === 0 && (
              <ResponsiveCard mobileClassName="mx-4" className="text-center py-8">
                <div className="text-themed-text opacity-60">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-themed-primary/20 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-themed-primary" />
                  </div>
                  <p className="mb-4">No active quests yet</p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setEditingQuest(null)
                      setShowQuestForm(true)
                    }}
                  >
                    Create Your First Quest
                  </button>
                </div>
              </ResponsiveCard>
            )}
          </motion.div>
        )

      case "reflection":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-4 ${isMobile ? "pb-24 px-4" : ""}`}
          >
            <ResponsiveCard>
              <h3 className="text-lg font-semibold text-themed-text mb-4">Personal Reflection</h3>
              <p className="text-themed-text opacity-70 text-sm mb-6">
                Share your current mood and situation to get personalized quests
              </p>
              <form onSubmit={handleReflectionSubmit} className="space-y-4">
                <div>
                  <Label className="text-themed-text">Current Mood</Label>
                  <Input
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="How are you feeling?"
                    className="input-themed mt-1"
                  />
                </div>
                <div>
                  <Label className="text-themed-text">Emotional State</Label>
                  <Textarea
                    value={emotionalState}
                    onChange={(e) => setEmotionalState(e.target.value)}
                    placeholder="Describe your emotional landscape in detail"
                    className="input-themed mt-1"
                  />
                </div>
                <div>
                  <Label className="text-themed-text">Current Challenges</Label>
                  <Textarea
                    value={currentChallenges}
                    onChange={(e) => setCurrentChallenges(e.target.value)}
                    placeholder="What obstacles are you facing?"
                    className="input-themed mt-1"
                  />
                </div>
                <div>
                  <Label className="text-themed-text">Motivation Level</Label>
                  <Input
                    value={motivationLevel}
                    onChange={(e) => setMotivationLevel(e.target.value)}
                    placeholder="How is your energy and drive?"
                    className="input-themed mt-1"
                  />
                </div>
                {reflectionError && <div className="text-red-500 text-sm">{reflectionError}</div>}
                <Button type="submit" className="btn-primary w-full mt-2">
                  Save Reflection
                </Button>
              </form>
            </ResponsiveCard>

            {/* Reflection History */}
            <ResponsiveCard>
              <h4 className="text-md font-semibold text-themed-text mb-2">Reflection History</h4>
              {getReflections().length === 0 ? (
                <div className="text-themed-text opacity-60 text-sm">
                  No reflections yet. Your saved reflections will appear here.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-themed-border">
                  {getReflections().map((reflection, idx) => (
                    <div key={idx} className="py-2">
                      <div className="text-xs text-themed-text opacity-60 mb-1">
                        {new Date(reflection.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Mood:</span> {reflection.mood}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Emotional State:</span> {reflection.emotionalState}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Challenges:</span> {reflection.currentChallenges}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Motivation:</span> {reflection.motivationLevel}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ResponsiveCard>
          </motion.div>
        )

      case "stats":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <StatsPanel stats={player.stats} customAttributes={player.customAttributes} />
          </motion.div>
        )

      case "achievements":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <AchievementsPanel achievements={achievements} completedQuests={completedQuests} />
          </motion.div>
        )

      case "analytics":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <AnalyticsDashboard isMobile={isMobile} />
          </motion.div>
        )

      case "settings":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <SettingsPage
              player={player}
              onUpdateName={updatePlayerName}
              onThemeChange={updateTheme}
              onReset={resetPlayer}
            />
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <ResponsiveLayout>
      <motion.div
        className="main-container min-h-screen relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Background Effects */}
        <ParticleBackground />
        <FloatingElements />

        {/* Navigation */}
        <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className={`relative z-20 ${!isMobile ? "p-6" : ""}`}>{renderTabContent()}</div>

        {/* Quest Form Modal */}
        {showQuestForm && (
          <QuestForm
            onSubmit={handleQuestSubmit}
            onClose={() => {
              setShowQuestForm(false)
              setEditingQuest(null)
            }}
            editQuest={editingQuest || undefined}
            isEditing={Boolean(editingQuest)}
          />
        )}
      </motion.div>
    </ResponsiveLayout>
  )
})

export default Dashboard
