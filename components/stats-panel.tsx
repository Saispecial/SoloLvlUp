import { Brain, Heart, Dumbbell, Lightbulb, Users, HelpCircle, Star, TrendingUp } from "lucide-react"
import type { PlayerStats, StatBreakthrough } from "@/lib/types"
import { calculateStatBreakthrough, getStatTierInfo } from "@/lib/rpg-engine"

interface StatsPanelProps {
  stats: PlayerStats
  statBreakthroughs?: Record<keyof PlayerStats, StatBreakthrough>
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

export function StatsPanel({ stats, statBreakthroughs, customAttributes = {} }: StatsPanelProps) {
  const getBreakthroughInfo = (stat: keyof PlayerStats, value: number) => {
    const breakthrough = statBreakthroughs?.[stat] || calculateStatBreakthrough(value)
    const tierInfo = getStatTierInfo(breakthrough)
    return { breakthrough, tierInfo }
  }

  return (
    <div className="card-themed p-6">
      <h2 className="text-xl font-semibold text-themed-text mb-4">Character Stats</h2>
      <div className="space-y-4">
        {Object.entries(stats).map(([stat, value]) => {
          const Icon = statIcons[stat as keyof typeof statIcons] || Star
          const { breakthrough, tierInfo } = getBreakthroughInfo(stat as keyof PlayerStats, value)
          const isBeyondBase = breakthrough.tier > 0

          return (
            <div key={stat} className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-themed-accent" />
              <div className="flex-1">
                <div className="flex justify-between items-center text-sm text-themed-text mb-1">
                  <span className="flex items-center gap-2">
                    {stat}
                    {isBeyondBase && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tierInfo.tierColor} bg-opacity-20`}>
                        {tierInfo.tierName} Tier
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    {isBeyondBase && <TrendingUp className="w-3 h-3 text-themed-primary" />}
                    <span className={isBeyondBase ? tierInfo.tierColor : ""}>
                      {value} {/* Fixed: replaced breakdown.displayValue with value */}
                      {isBeyondBase && <span className="text-xs ml-1">({value} total)</span>}
                    </span>
                  </span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min((breakthrough.displayValue / 100) * 100, 100)}%`,
                    }}
                  />
                </div>
                {isBeyondBase && (
                  <div className="text-xs text-themed-text-secondary mt-1">Next tier at {tierInfo.nextTierAt}</div>
                )}
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
