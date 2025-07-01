"use client"

import { CheckCircle, Circle, Trash2, Clock, Edit, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Quest } from "@/lib/types"

interface QuestCardProps {
  quest: Quest
  onComplete: (questId: string) => void
  onDelete: (questId: string) => void
  onEdit: (quest: Quest) => void
}

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

export function QuestCard({ quest, onComplete, onDelete, onEdit }: QuestCardProps) {
  const isOverdue = quest.dueDate && new Date() > new Date(quest.dueDate)

  return (
    <div className="quest-card p-4 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${typeColors[quest.type]} text-white text-xs`}>{quest.type}</Badge>
          {isOverdue && (
            <Badge className="bg-red-500 text-white text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(quest)}
            className="text-themed-accent hover:text-themed-primary p-1"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(quest.id)}
            className="text-red-400 hover:text-red-300 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComplete(quest.id)}
            className={`p-1 ${quest.completed ? "text-green-500" : "text-gray-400 hover:text-green-400"}`}
          >
            {quest.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <h3 className="text-lg font-medium text-themed-text mb-2">{quest.title}</h3>

      <div className="space-y-3">
        <p className="text-themed-text opacity-80 text-sm">{quest.description}</p>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Badge className={`${difficultyColors[quest.difficulty]} text-white text-xs`}>{quest.difficulty}</Badge>
            <Badge variant="outline" className="text-xs border-themed-border text-themed-text">
              {quest.realm}
            </Badge>
          </div>
          <span className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-yellow-400"}`}>
            +{quest.xp} XP
          </span>
        </div>

        {quest.dueDate && (
          <div
            className={`text-sm flex items-center gap-2 ${isOverdue ? "text-red-400 font-medium" : "text-themed-text opacity-60"}`}
          >
            <Clock className="w-4 h-4" />
            <span>
              Due: {new Date(quest.dueDate).toLocaleDateString()} at {new Date(quest.dueDate).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
