"use client"

import React, { useState, useEffect } from "react"
import { VoicePlayer } from "@/components/VoicePlayer"

interface VoiceFeedItemProps {
  note: {
    id: string
    audioUrl: string
    duration: number
    createdAt: string
  }
  onDelete: (id: string) => void
}

export function VoiceFeedItem({ note, onDelete }: VoiceFeedItemProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!confirm("Delete this voice note?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/voices?id=${note.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete")
      }
      onDelete(note.id)
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Failed to delete voice note")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center justify-between gap-3">
      <VoicePlayer audioUrl={note.audioUrl} duration={note.duration} />
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-gray-400 font-medium">
          {formattedDate || "just now"}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete voice note"
          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
