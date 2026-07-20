"use client"

import React, { useState, useEffect, useCallback } from "react"
import { VoiceFeedItem } from "./VoiceFeedItem"
import { useSessionId } from "@/hooks/useSessionId"

interface VoiceNote {
  id: string
  audioUrl: string
  duration: number
  createdAt: string
}

export function VoiceFeed({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const sessionId = useSessionId()
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [myNotesOnly, setMyNotesOnly] = useState(false)

  const fetchVoices = useCallback(async (cursor?: string, silent = false) => {
    try {
      if (!silent) {
        if (cursor) {
          setLoadingMore(true)
        } else {
          setLoading(true)
        }
      }
      if (!silent) setError(null)

      const url = new URL("/api/voices", window.location.origin)
      if (cursor) {
        url.searchParams.set("cursor", cursor)
      }
      url.searchParams.set("limit", "3")

      if (myNotesOnly && sessionId) {
        url.searchParams.set("sessionId", sessionId)
      }

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
      if (!silent) {
        const message = err instanceof Error ? err.message : "Failed to fetch voices"
        setError(message)
      }
      console.error(err)
    } finally {
      if (!silent) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [myNotesOnly, sessionId])

  useEffect(() => {
    fetchVoices()
  }, [refreshTrigger, fetchVoices])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchVoices(undefined, true)
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchVoices])

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading voice feed">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-100 h-14 rounded-lg border border-gray-200"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
        <p className="text-xs text-red-600 font-medium">{error}</p>
        <button
          type="button"
          onClick={() => fetchVoices()}
          className="mt-2 px-3 py-1.5 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors duration-150"
        >
          Try again
        </button>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setMyNotesOnly((prev) => !prev)}
            aria-label={myNotesOnly ? "Show all voice notes" : "Show only my voice notes"}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              myNotesOnly
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span>{myNotesOnly ? "My Notes" : "All Voices"}</span>
          </button>
        </div>
        <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
          {myNotesOnly ? (
            <>
              <span className="text-2xl" role="img" aria-label="Microphone">??</span>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No notes yet
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Record your first voice note above
              </p>
            </>
          ) : (
            <>
              <span className="text-2xl" role="img" aria-label="Microphone">??</span>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No voice notes yet
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Be the first to record
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setMyNotesOnly((prev) => !prev)}
          aria-label={myNotesOnly ? "Show all voice notes" : "Show only my voice notes"}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            myNotesOnly
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span>{myNotesOnly ? "My Notes" : "All Voices"}</span>
        </button>
      </div>
      <div className="space-y-2">
        {notes.map((note) => (
          <VoiceFeedItem key={note.id} note={note} />
        ))}
      </div>

      {nextCursor && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => fetchVoices(nextCursor)}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  )
}
