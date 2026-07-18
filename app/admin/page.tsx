"use client"

import React, { useState, useEffect } from "react"
import { VoicePlayer } from "@/components/VoicePlayer"

interface VoiceNote {
  id: string
  audioUrl: string
  duration: number
  createdAt: string
}

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth")
    if (stored) {
      setAuthenticated(true)
      fetchNotes(stored)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchNotes = async (secret?: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/voices?limit=100")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotes(data.notes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setLoginError("Enter the admin password")
      return
    }
    sessionStorage.setItem("admin_auth", password)
    setAuthenticated(true)
    fetchNotes()
  }

  const handleDelete = async (id: string) => {
    setDeleteError(null)
    setDeleting(id)
    try {
      const secret = sessionStorage.getItem("admin_auth")
      const res = await fetch(`/api/voices?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-secret": secret || "" },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Delete failed")
      }
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeleting(null)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Admin Login</h1>
          {loginError && (
            <p className="text-sm text-red-600 mb-4">{loginError}</p>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLoginError(null) }}
            placeholder="Enter admin password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Login
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Admin — Voice Notes</h1>
          <button
            type="button"
            onClick={() => { sessionStorage.removeItem("admin_auth"); setAuthenticated(false) }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>

        {deleteError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{deleteError}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg border border-gray-200" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center text-gray-500 py-16">No voice notes yet.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center justify-between gap-3">
                <VoicePlayer audioUrl={note.audioUrl} duration={note.duration} />
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    disabled={deleting === note.id}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    aria-label="Delete"
                  >
                    {deleting === note.id ? (
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
