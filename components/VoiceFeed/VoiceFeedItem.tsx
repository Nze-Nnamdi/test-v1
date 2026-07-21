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
  const [reported, setReported] = useState(false)
  const [reporting, setReporting] = useState(false)
  const isOwner = note.sessionId === userSessionId

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

  const handleReport = async () => {
    if (reported || reporting || isOwner) return
    setReporting(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceNoteId: note.id, sessionId: userSessionId }),
      })
      if (res.ok) {
        setReported(true)
      }
    } catch {
    } finally {
      setReporting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm flex items-center justify-between">
      <VoicePlayer audioUrl={note.audioUrl} duration={note.duration} noteId={note.id} playCount={note.playCount} showPlayCount={showPlayCount} isOwner={isOwner} />
      <div className="flex items-center space-x-2">
        <span className="text-[10px] text-gray-400 font-medium">
          {formattedDate || "just now"}
        </span>
        {!isOwner && (
          <button
            type="button"
            disabled={reported || reporting}
            onClick={handleReport}
            className={`text-[10px] font-medium transition-colors duration-150 ${
              reported
                ? "text-red-400 cursor-default"
                : "text-gray-300 hover:text-red-400"
            }`}
          >
            {reported ? "Reported" : reporting ? "..." : "Report"}
          </button>
        )}
      </div>
    </div>
  )
}
