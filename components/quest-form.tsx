"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { Quest } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

interface QuestFormProps {
  onSubmit: (quest: Omit<Quest, "id" | "completed" | "createdAt">) => void
  onClose: () => void
  editQuest?: Quest
  isEditing?: boolean
}

export function QuestForm({ onSubmit, onClose, editQuest, isEditing = false }: QuestFormProps) {
  const [formData, setFormData] = useState({
    title: editQuest?.title || "",
    description: editQuest?.description || "",
    xp: editQuest?.xp || 100,
    type: editQuest?.type || "daily",
    difficulty: editQuest?.difficulty || "medium",
    realm: editQuest?.realm || "Physical",
    statBoosts: editQuest?.statBoosts || {},
    dueDate: editQuest?.dueDate || "",
    recurring: editQuest?.recurring || false,
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    const handleSubmit = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleFormSubmit(e as any)
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.addEventListener("keydown", handleSubmit)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("keydown", handleSubmit)
    }
  }, [formData])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (formData.xp < 1) {
      newErrors.xp = "XP must be at least 1"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSubmit({
      ...formData,
      xp: Number(formData.xp),
    })
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-themed-card border border-themed-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-2rem)] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-6 border-b border-themed-border flex-shrink-0">
            <h2 className="text-2xl font-bold text-themed-text">{isEditing ? "Edit Quest" : "Create New Quest"}</h2>
            <button
              onClick={onClose}
              className="text-themed-text hover:text-themed-accent transition-colors p-2 hover:bg-themed-accent/10 rounded-lg"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-themed-text font-medium">
                  Quest Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Enter quest title"
                  className={`mt-2 input-themed ${errors.title ? "border-red-500" : ""}`}
                  autoFocus
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-themed-text font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your quest"
                  className={`mt-2 input-themed min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* XP Reward */}
              <div>
                <Label htmlFor="xp" className="text-themed-text font-medium">
                  XP Reward *
                </Label>
                <Input
                  id="xp"
                  type="number"
                  value={formData.xp}
                  onChange={(e) => handleChange("xp", Number.parseInt(e.target.value) || 0)}
                  placeholder="100"
                  min="1"
                  className={`mt-2 input-themed ${errors.xp ? "border-red-500" : ""}`}
                />
                {errors.xp && <p className="text-red-500 text-sm mt-1">{errors.xp}</p>}
              </div>

              {/* Type and Difficulty Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type" className="text-themed-text font-medium">
                    Quest Type
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                    <SelectTrigger className="mt-2 input-themed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="main">Main Quest</SelectItem>
                      <SelectItem value="side">Side Quest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty" className="text-themed-text font-medium">
                    Difficulty
                  </Label>
                  <Select value={formData.difficulty} onValueChange={(value) => handleChange("difficulty", value)}>
                    <SelectTrigger className="mt-2 input-themed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="extreme">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Realm */}
              <div>
                <Label htmlFor="realm" className="text-themed-text font-medium">
                  Realm
                </Label>
                <Select value={formData.realm} onValueChange={(value) => handleChange("realm", value)}>
                  <SelectTrigger className="mt-2 input-themed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physical">Physical</SelectItem>
                    <SelectItem value="Mental">Mental</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Spiritual">Spiritual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stat Boosts */}
              <div>
                <Label className="text-themed-text font-medium mb-2 block">Stat Boosts (Optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["IQ", "EQ", "Strength", "Charisma", "Wisdom", "Luck"].map((stat) => (
                    <div key={stat} className="flex items-center gap-2">
                      <Label htmlFor={stat} className="text-themed-text text-sm min-w-[80px]">
                        {stat}
                      </Label>
                      <Input
                        id={stat}
                        type="number"
                        value={formData.statBoosts[stat] || 0}
                        onChange={(e) =>
                          handleChange("statBoosts", {
                            ...formData.statBoosts,
                            [stat]: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        min="0"
                        className="input-themed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <Label htmlFor="dueDate" className="text-themed-text font-medium">
                  Due Date (Optional)
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  className="mt-2 input-themed"
                />
              </div>

              {/* Recurring Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  id="recurring"
                  type="checkbox"
                  checked={formData.recurring}
                  onChange={(e) => handleChange("recurring", e.target.checked)}
                  className="w-4 h-4 text-themed-primary bg-themed-background border-themed-border rounded focus:ring-themed-primary"
                />
                <Label htmlFor="recurring" className="text-themed-text font-medium cursor-pointer">
                  Make this quest recurring
                </Label>
              </div>
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="flex gap-3 p-6 border-t border-themed-border flex-shrink-0">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 btn-secondary bg-transparent">
              Cancel
            </Button>
            <Button type="submit" onClick={handleFormSubmit} className="flex-1 btn-primary">
              {isEditing ? "Update Quest" : "Create Quest"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
