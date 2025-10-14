"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { Quest } from "@/lib/types"

interface QuestFormProps {
  onSubmit: (quest: Omit<Quest, "id" | "completed" | "createdAt">) => void
  onClose: () => void
  editQuest?: Quest
  isEditing?: boolean
}

export function QuestForm({ onSubmit, onClose, editQuest, isEditing = false }: QuestFormProps) {
  const [title, setTitle] = useState(editQuest?.title || "")
  const [description, setDescription] = useState(editQuest?.description || "")
  const [type, setType] = useState<Quest["type"]>(editQuest?.type || "daily")
  const [difficulty, setDifficulty] = useState<Quest["difficulty"]>(editQuest?.difficulty || "easy")
  const [realm, setRealm] = useState<Quest["realm"]>(editQuest?.realm || "mind")
  const [xp, setXp] = useState(editQuest?.xp || 10)
  const [statBoosts, setStatBoosts] = useState(
    editQuest?.statBoosts || {
      IQ: 0,
      EQ: 0,
      Strength: 0,
      TechnicalAttribute: 0,
      Aptitude: 0,
      ProblemSolving: 0,
    },
  )
  const [dueDate, setDueDate] = useState(editQuest?.dueDate || "")
  const [recurring, setRecurring] = useState(editQuest?.recurring || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      type,
      difficulty,
      realm,
      xp,
      statBoosts,
      dueDate: dueDate || undefined,
      recurring,
    })
  }

  useEffect(() => {
    const difficultyXP = {
      easy: 10,
      medium: 25,
      hard: 50,
      legendary: 100,
    }
    setXp(difficultyXP[difficulty])
  }, [difficulty])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-cyan-400/30 w-full max-w-2xl shadow-2xl shadow-cyan-500/20 flex flex-col max-h-[calc(100vh-2rem)]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">{isEditing ? "Edit Quest" : "Create New Quest"}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-lg"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/40">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                placeholder="Enter quest title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                placeholder="Describe your quest"
                rows={3}
                required
              />
            </div>

            {/* Type and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Quest["type"])}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="main">Main Quest</option>
                  <option value="side">Side Quest</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Quest["difficulty"])}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="easy">Easy (10 XP)</option>
                  <option value="medium">Medium (25 XP)</option>
                  <option value="hard">Hard (50 XP)</option>
                  <option value="legendary">Legendary (100 XP)</option>
                </select>
              </div>
            </div>

            {/* Realm */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Realm</label>
              <select
                value={realm}
                onChange={(e) => setRealm(e.target.value as Quest["realm"])}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="mind">Mind & Skill</option>
                <option value="body">Body & Fitness</option>
                <option value="social">Social & Relationships</option>
                <option value="work">Work & Career</option>
                <option value="creative">Creative & Hobbies</option>
              </select>
            </div>

            {/* Stat Boosts */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Stat Boosts</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(statBoosts).map(([stat, value]) => (
                  <div key={stat} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <span className="text-gray-300 text-sm">
                      {stat === "TechnicalAttribute"
                        ? "Technical Attribute"
                        : stat === "ProblemSolving"
                          ? "Problem Solving"
                          : stat}
                    </span>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setStatBoosts({ ...statBoosts, [stat]: Number.parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:border-cyan-400"
                      min="0"
                      max="10"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due Date & Time (Optional)</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Recurring */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="recurring"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-5 h-5 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-cyan-400 text-cyan-400"
              />
              <label htmlFor="recurring" className="text-sm text-gray-300 cursor-pointer">
                Recurring Quest (Resets after completion)
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/30 font-semibold"
              >
                {isEditing ? "Update Quest" : "Create Quest"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
