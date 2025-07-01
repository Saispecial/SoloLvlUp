import { Brain, Heart, Dumbbell, Lightbulb, Users, HelpCircle, Star } from "lucide-react"
import type { PlayerStats } from "@/lib/types"

interface StatsPanelProps {
  stats: PlayerStats
  customAttributes?: Record<string, number>
}

const statIcons = {
  IQ: Brain,
  EQ: Heart,
  Strength: Dumbbell,
  "Technical Attribute": Lightbulb,
  Aptitude: Users,
  "Problem Solving": HelpCircle,
}

export function StatsPanel({ stats, customAttributes = {} }: StatsPanelProps) {
  return (
    <div className="card-themed p-6">
      <h2 className="text-xl font-semibold text-themed-text mb-4">Character Stats</h2>
      <div className="space-y-4">
        {Object.entries(stats).map(([stat, value]) => {
          const Icon = statIcons[stat as keyof typeof statIcons] || Star
          return (
            <div key={stat} className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-themed-accent" />
              <div className="flex-1">
                <div className="flex justify-between text-sm text-themed-text mb-1">
                  <span>{stat}</span>
                  <span>{value}</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill" style={{ width: `${Math.min((value / 100) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          )
        })}

        {Object.keys(customAttributes).length > 0 && (
          <>
            <div className="border-t border-themed-border pt-4">
              <h4 className="text-sm font-medium text-themed-text mb-3">Custom Attributes</h4>
              {Object.entries(customAttributes).map(([name, value]) => (
                <div key={name} className="flex items-center gap-3 mb-3">
                  <Star className="w-5 h-5 text-themed-primary" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-themed-text mb-1">
                      <span>{name}</span>
                      <span>{value}</span>
                    </div>
                    <div className="progress-bar h-2">
                      <div className="progress-fill" style={{ width: `${Math.min((value / 100) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
