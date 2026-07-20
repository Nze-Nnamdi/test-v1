"use client"

import React, { useState, useEffect } from "react"
import { VoicePlayer } from "@/components/VoicePlayer"

interface VoiceFeedItemProps {
  note: {
    id: string
    audioUrl: string
    duration: number
    playCount: number
    sessionId: string | null
    createdAt: string
  }
  showPlayCount: boolean
  userSessionId: string
}

export function VoiceFeedItem({ note, showPlayCount, userSessionId }: VoiceFeedItemProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")

  useEffect(() => {
    const date = new Date(note.createdAt)
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    const diffMs = date.getTime() - Date.now()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (Math.abs(diffMins) < 60) {
      setFormattedDate(rtf.format(diffMins, "minute"))
    } else if (Math.abs(diffHours) < 24) {
      setFormattedDate(rtf.format(diffHours, "hour"))
    } else if (Math.abs(diffDays) < 7) {
      setFormattedDate(rtf.format(diffDays, "day"))
    } else {
      setFormattedDate(
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
    }
  }, [note.createdAt])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm flex items-center justify-between">
      <VoicePlayer audioUrl={note.audioUrl} duration={note.duration} noteId={note.id} playCount={note.playCount} showPlayCount={showPlayCount} isOwner={note.sessionId === userSessionId} />
      <span className="text-[10px] text-gray-400 font-medium">
        {formattedDate || "just now"}
      </span>
    </div>
  )
}
