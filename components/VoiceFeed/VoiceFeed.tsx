"use client"

import React, { useState, useEffect, useCallback } from "react"
import { VoiceFeedItem } from "./VoiceFeedItem"
import { getBrowserSupabase } from "@/lib/supabase"

interface VoiceNote {
  id: string
  audioUrl: string
  duration: number
  createdAt: string
}

export function VoiceFeed({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const fetchVoices = async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const url = new URL("/api/voices", window.location.origin)
      if (cursor) {
        url.searchParams.set("cursor", cursor)
      }
      url.searchParams.set("limit", "20")

      const res = await fetch(url.toString())
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to load feed")
      }
      
      if (cursor) {
        setNotes((prev) => [...prev, ...data.notes])
      } else {
        setNotes(data.notes)
      }
      setNextCursor(data.nextCursor)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch voices"
      setError(message)
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchVoices()
  }, [refreshTrigger])

  useEffect(() => {
    let supabase: ReturnType<typeof getBrowserSupabase> | null = null
    try {
      supabase = getBrowserSupabase()
    } catch {
      return
    }

    const channel = supabase
      .channel("voice-notes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "VoiceNote" },
        (payload) => {
          const newNote = payload.new as VoiceNote
          setNotes((prev) => [newNote, ...prev])
          setLoading(false)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading voice feed">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-100 h-20 rounded-lg border border-gray-200"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button
          type="button"
          onClick={() => fetchVoices()}
          className="mt-3 px-4 py-2 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors duration-150"
        >
          Try again
        </button>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
        <span className="text-4xl" role="img" aria-label="Microphone">
          🎤
        </span>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No voice notes yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Be the first to record
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {notes.map((note) => (
          <VoiceFeedItem key={note.id} note={note} />
        ))}
      </div>

      {nextCursor && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => fetchVoices(nextCursor)}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  )
}
