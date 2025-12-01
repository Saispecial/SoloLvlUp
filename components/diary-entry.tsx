"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Sparkles, Send, Loader2, Trash2, Eye, Heart, Brain } from "lucide-react"
import { usePlayerStore } from "@/stores/player-store"
import { Card3D } from "./3d-card"
import { FuturisticButton } from "./futuristic-button"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import type { DiaryEntry, PersonalReflection } from "@/lib/types"

interface DiaryEntryProps {
  isMobile?: boolean
}

export function DiaryEntryComponent({ isMobile = false }: DiaryEntryProps) {
  const { addDiaryEntry, convertDiaryToReflection, deleteDiaryEntry, getDiaryEntries, getReflections } =
    usePlayerStore()

  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConverting, setIsConverting] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)

  const diaryEntries = getDiaryEntries()
  const reflections = getReflections()

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await addDiaryEntry(content.trim())
      setContent("")
      const entries = getDiaryEntries()
      if (entries.length > 0) {
        setSelectedEntry(entries[0])
      }
    } catch (error) {
      console.error("Error adding diary entry:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConvert = async (diaryId: string) => {
    setIsConverting(diaryId)
    try {
      await convertDiaryToReflection(diaryId)
    } catch (error) {
      console.error("Error converting diary to reflection:", error)
    } finally {
      setIsConverting(null)
    }
  }

  const handleDelete = (diaryId: string) => {
    deleteDiaryEntry(diaryId)
  }

  const getRelatedReflection = (diaryEntry: DiaryEntry): PersonalReflection | null => {
    if (!diaryEntry.reflectionId) return null
    return reflections.find((r) => r.timestamp.toString() === diaryEntry.reflectionId) || null
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* New Diary Entry */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-purple-400/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-400 to-pink-500">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-400">Daily Diary</h3>
            <p className="text-sm text-gray-400">Write your thoughts and let AI convert them to insights</p>
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about your day, feelings, challenges, or anything on your mind..."
            className="min-h-[120px] bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-400"
            disabled={isSubmitting}
          />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4" />
              <span>AI will analyze your emotions and convert to reflection</span>
            </div>

            <FuturisticButton
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? "Saving..." : "Save Entry"}
            </FuturisticButton>
          </div>
        </div>
      </Card3D>

      {/* Diary History */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-blue-400/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-500">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-blue-400">Diary History</h3>
            {diaryEntries.length > 0 && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {diaryEntries.length} {diaryEntries.length === 1 ? "entry" : "entries"}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-blue-400 hover:text-blue-300"
          >
            {showHistory ? "Hide" : "Show"} History
          </Button>
        </div>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {diaryEntries.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-400">No diary entries yet. Start writing to see your history!</p>
                </div>
              ) : (
                diaryEntries.map((entry) => {
                  const relatedReflection = getRelatedReflection(entry)

                  return (
                    <motion.div
                      key={entry.id}
                      variants={itemVariants}
                      className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-400/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm text-gray-400">{formatDate(entry.timestamp)}</span>

                        <div className="flex items-center gap-2">
                          {entry.convertedToReflection && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                              <Heart className="w-3 h-3 mr-1" />
                              Analyzed
                            </Badge>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)
                            }}
                            className="text-blue-400 hover:text-blue-300 p-1"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {!entry.convertedToReflection && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleConvert(entry.id)
                              }}
                              disabled={isConverting === entry.id}
                              className="text-purple-400 hover:text-purple-300 p-1"
                            >
                              {isConverting === entry.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(entry.id)
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {selectedEntry?.id === entry.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 mt-3 pt-3 border-t border-gray-700"
                          >
                            <div className="text-sm text-gray-300 whitespace-pre-wrap">{entry.content}</div>

                            {relatedReflection && (
                              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Brain className="w-4 h-4 text-purple-400" />
                                  <span className="text-sm font-medium text-purple-400">AI Analysis</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-400">Mood:</span>
                                    <span className="ml-2 text-white">{relatedReflection.mood}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Motivation:</span>
                                    <span className="ml-2 text-purple-400">{relatedReflection.motivationLevel}/10</span>
                                  </div>
                                  <div className="md:col-span-2">
                                    <span className="text-gray-400">Emotional State:</span>
                                    <span className="ml-2 text-white">{relatedReflection.emotionalState}</span>
                                  </div>
                                  <div className="md:col-span-2">
                                    <span className="text-gray-400">Challenges:</span>
                                    <span className="ml-2 text-white">{relatedReflection.currentChallenges}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {!entry.convertedToReflection && (
                              <div className="text-xs text-gray-400 italic pt-2">
                                Click the <Sparkles className="w-3 h-3 inline" /> icon to analyze this entry with AI
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card3D>
    </motion.div>
  )
}
