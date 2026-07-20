"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "echoes_session_id"

export function useSessionId(): string {
  const [sessionId, setSessionId] = useState<string>("")

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    setSessionId(id)
  }, [])

  return sessionId
}
