"use client"

import type React from "react"
import { useState } from "react"
import {
  Moon,
  Zap,
  Compass,
  Flame,
  Leaf,
  Crown,
  Sunrise,
  Waves,
  Sunset,
  Pencil,
  AlertTriangle,
  Sun,
  Sparkles,
  TreePine,
  Droplet,
  Calendar,
  Clock,
  Mic,
  Palette,
  Star,
  Heart,
  Zap as Lightning,
} from "lucide-react"
import { format } from "date-fns"
import type { PlayerProfile, Theme } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SettingsPageProps {
  player: PlayerProfile
  onUpdateName: (name: string) => void
  onThemeChange: (theme: Theme) => void
  onReset: () => void
}

export function SettingsPage({ player, onUpdateName, onThemeChange, onReset }: SettingsPageProps) {
  const [name, setName] = useState(player.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedTime, setSelectedTime] = useState(format(new Date(), "HH:mm"))
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onUpdateName(name.trim())
      setIsEditingName(false)
    }
  }

  const themes = [
    { id: "classic-dark", name: "Classic Dark", icon: Moon, description: "Minimalist black-gray theme" },
    { id: "cyberpunk-neon", name: "Cyberpunk Neon", icon: Zap, description: "Dark with neon purple highlights" },
    { id: "deep-space", name: "Deep Space", icon: Compass, description: "Galaxy-inspired gradients" },
    { id: "inferno-red", name: "Inferno Red", icon: Flame, description: "Dark with fiery red tones" },
    { id: "emerald-forest", name: "Emerald Forest", icon: Leaf, description: "Rich green forest theme" },
    { id: "royal-purple", name: "Royal Purple", icon: Crown, description: "Elegant purple royalty theme" },
    { id: "crimson-dawn", name: "Crimson Dawn", icon: Sunrise, description: "Deep crimson highlights" },
    { id: "ocean-breeze", name: "Ocean Breeze", icon: Waves, description: "Calming cyan sea theme" },
    { id: "sunset-orange", name: "Sunset Orange", icon: Sunset, description: "Warm orange sunset colors" },
    { id: "golden-dawn", name: "Golden Dawn", icon: Sun, description: "Radiant yellow sunrise theme" },
    { id: "neon-yellow", name: "Neon Yellow", icon: Sparkles, description: "Vibrant electric yellow glow" },
    { id: "dark-forest", name: "Dark Forest", icon: TreePine, description: "Deep emerald forest theme" },
    { id: "deep-cyan", name: "Deep Cyan", icon: Droplet, description: "Rich dark cyan waters" },
    { id: "aurora-borealis", name: "Aurora Borealis", icon: Star, description: "Northern lights green glow" },
    { id: "midnight-storm", name: "Midnight Storm", icon: Lightning, description: "Dark stormy indigo theme" },
    { id: "cosmic-purple", name: "Cosmic Purple", icon: Palette, description: "Deep space purple theme" },
    { id: "neon-pink", name: "Neon Pink", icon: Heart, description: "Vibrant pink neon theme" },
    { id: "golden-sunset", name: "Golden Sunset", icon: Sunset, description: "Warm golden sunset theme" },
  ] as const

  const handleReset = () => {
    onReset()
    setShowResetConfirm(false)
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold mb-2 text-themed-text">Settings</h1>
        <p className="text-themed-text opacity-60">Customize your hunter profile and appearance</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-themed-text">Profile Settings</h2>
        <div className="card-themed p-6">
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-themed-text opacity-80 mb-1">Hunter Name</Label>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <form onSubmit={handleNameSubmit} className="flex-1 flex gap-2">
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-themed flex-1"
                      placeholder="Enter your hunter name"
                      autoFocus
                    />
                    <Button type="submit" className="btn-primary">
                      Save
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false)
                        setName(player.name)
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-themed-text text-lg">{player.name}</span>
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="ghost"
                      size="sm"
                      className="text-themed-accent hover:text-themed-primary"
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-themed-text opacity-80 mb-1">System Date & Time</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 input-themed px-4 py-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-themed-accent" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none text-themed-text p-0"
                  />
                </div>
                <div className="flex items-center gap-2 input-themed px-4 py-2 rounded-lg">
                  <Clock className="w-5 h-5 text-themed-accent" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="bg-transparent border-none text-themed-text p-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-themed-text">Voice Assistant</h2>
        <div className="card-themed p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-themed-text">Voice Commands</h3>
              <p className="text-sm text-themed-text opacity-60">Enable voice assistant to use commands</p>
            </div>
            <Button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-3 rounded-full transition-colors ${
                isVoiceEnabled ? "bg-themed-primary text-white" : "bg-themed-surface border border-themed-border"
              }`}
            >
              <Mic className="w-6 h-6" />
            </Button>
          </div>

          {isVoiceEnabled && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-themed-text">Available Commands:</p>
              <ul className="space-y-2 text-sm text-themed-text opacity-60">
                <li>"Arise, status" - Get your level and rank</li>
                <li>"Arise, stats" - List all your stats</li>
                <li>"Arise, quests" - View active quests</li>
                <li>"Arise, help" - List available commands</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-themed-text">Theme Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {themes.map(({ id, name: themeName, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => onThemeChange(id as Theme)}
              className={`theme-selector p-6 rounded-lg text-left transition-all duration-200 ${
                player.theme === id ? "selected" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-2 w-full">
                <Icon className={`w-6 h-6 ${player.theme === id ? "text-themed-primary" : "text-themed-accent"}`} />
                <span className="font-medium text-themed-text">{themeName}</span>
              </div>
              <p className="text-sm text-themed-text opacity-60">{description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-themed-text">Reset Application</h2>
        <div className="card-themed border border-red-500/20 p-6">
          <div className="space-y-4">
            {showResetConfirm ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                  <p className="font-medium">Are you sure you want to reset?</p>
                </div>
                <p className="text-themed-text opacity-60">
                  This action will reset all your progress, quests, achievements, and settings to their default values.
                  This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleReset} className="bg-red-500 hover:bg-red-600 text-white">
                    Yes, Reset Everything
                  </Button>
                  <Button onClick={() => setShowResetConfirm(false)} className="btn-secondary">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-themed-text opacity-60">
                  Reset all application data to its initial state. This will clear all your progress and cannot be
                  undone.
                </p>
                <Button
                  onClick={() => setShowResetConfirm(true)}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Reset Application
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
