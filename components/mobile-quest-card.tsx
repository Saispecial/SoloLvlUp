"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Circle, Edit, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import type { Quest } from "@/lib/types"

interface MobileQuestCardProps {
  quest: Quest
  onComplete: (questId: string) => void
  onDelete: (questId: string) => void
  onEdit: (quest: Quest) => void
}

export function MobileQuestCard({ quest, onComplete, onDelete, onEdit }: MobileQuestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const isOverdue = quest.dueDate && new Date() > new Date(quest.dueDate)

  const difficultyColors = {
    Easy: "bg-green-500",
    Medium: "bg-yellow-500",
    Hard: "bg-red-500",
    "Life Achievement": "bg-purple-500",
  }

  const typeColors = {
    Daily: "bg-blue-500",
    Normal: "bg-gray-500",
    Weekly: "bg-green-500",
    Main: "bg-purple-500",
  }

  return (
    <motion.div
      layout
      className="bg-themed-surface rounded-lg border border-themed-border overflow-hidden"
      whileTap={{ scale: 0.98 }}
    >
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-themed-text truncate">{quest.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full text-white ${typeColors[quest.type]}`}>
                {quest.type}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <span className="text-sm font-bold text-yellow-400">+{quest.xp}</span>
            <button
              onClick={() => onComplete(quest.id)}
              className={`p-2 rounded-full transition-colors ${
                quest.completed
                  ? "text-green-500 bg-green-500/20"
                  : "text-gray-400 hover:text-green-400 hover:bg-green-400/10"
              }`}
            >
              {quest.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Description Preview */}
        <p className="text-sm text-themed-text opacity-80 mb-3 line-clamp-2">{quest.description}</p>

        {/* Quick Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full text-white ${difficultyColors[quest.difficulty]}`}>
              {quest.difficulty}
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-themed-primary/20 text-themed-primary">
              {quest.realm}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-full text-themed-accent hover:bg-themed-accent/10"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-full text-themed-text hover:bg-themed-surface"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-themed-border"
          >
            <div className="p-4 space-y-3">
              {/* Full Description */}
              <div>
                <h4 className="text-sm font-medium text-themed-text mb-1">Description</h4>
                <p className="text-sm text-themed-text opacity-80">{quest.description}</p>
              </div>

              {/* Due Date */}
              {quest.dueDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-themed-accent" />
                  <span className={`text-sm ${isOverdue ? "text-red-400 font-medium" : "text-themed-text opacity-60"}`}>
                    Due: {new Date(quest.dueDate).toLocaleDateString()} at{" "}
                    {new Date(quest.dueDate).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {/* Stat Boosts */}
              {quest.statBoosts && Object.values(quest.statBoosts).some((boost) => boost && boost > 0) && (
                <div>
                  <h4 className="text-sm font-medium text-themed-text mb-2">Stat Boosts</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(quest.statBoosts)
                      .filter(([_, boost]) => boost && boost > 0)
                      .map(([stat, boost]) => (
                        <div key={stat} className="flex justify-between text-xs">
                          <span className="text-themed-text opacity-80">{stat}</span>
                          <span className="text-themed-accent font-medium">+{boost}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-themed-border"
          >
            <div className="p-4 flex gap-3">
              <button
                onClick={() => onEdit(quest)}
                className="flex-1 py-3 px-4 bg-themed-primary/20 text-themed-primary rounded-lg font-medium text-sm"
              >
                Edit Quest
              </button>
              <button
                onClick={() => onDelete(quest.id)}
                className="flex-1 py-3 px-4 bg-red-500/20 text-red-400 rounded-lg font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
