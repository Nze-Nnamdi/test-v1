"use client"

import React, { useState, useEffect, useRef } from "react"
import { VoiceRecorderControls } from "./VoiceRecorderControls"

const MAX_RECORDING_SECONDS = 60

interface VoiceRecorderProps {
  onRecordComplete: () => void
}

export function VoiceRecorder({ onRecordComplete }: VoiceRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "review" | "submitting" | "success" | "error">("idle")
  const [countdown, setCountdown] = useState(MAX_RECORDING_SECONDS)
  const [errorMsg, setErrorMsg] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const durationRef = useRef<number>(0)

  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (state === "success") {
      const timer = setTimeout(resetRecording, 2000)
      return () => clearTimeout(timer)
    }
  }, [state])

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
  }

  const startRecording = async () => {
    try {
      setErrorMsg("")
      chunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      let mimeType = "audio/webm"
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4"
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/ogg"
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ""
      }

      const options = mimeType ? { mimeType } : undefined
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm"
          const blob = new Blob(chunksRef.current, { type: mimeType })
          setPreviewUrl(URL.createObjectURL(blob))
        }
        setState("review")
      }

      mediaRecorder.start(250)
      setState("recording")
      setCountdown(MAX_RECORDING_SECONDS)

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      console.error("Microphone access failed:", err)
      setErrorMsg("Microphone permission denied or not available.")
      setState("error")
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Capture the duration recorded
    durationRef.current = MAX_RECORDING_SECONDS - countdown

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const submitRecording = async () => {
    if (chunksRef.current.length === 0) return

    setState("submitting")
    setErrorMsg("")

    try {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm"
      const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogg" : "mp4"
      const audioBlob = new Blob(chunksRef.current, { type: mimeType })

      const formData = new FormData()
      formData.append("audio", audioBlob, `recording.${extension}`)
      const durationVal = Math.max(1, Math.round(durationRef.current))
      formData.append("duration", durationVal.toString())

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const res = await fetch("/api/voices", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setState("success")
      onRecordComplete()
    } catch (err: any) {
      console.error("Submission failed:", err)
      setErrorMsg(err.message || "Failed to submit recording. Please try again.")
      setState("error")
    }
  }

  const resetRecording = () => {
    cleanup()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setState("idle")
    setCountdown(MAX_RECORDING_SECONDS)
    setErrorMsg("")
    chunksRef.current = []
    durationRef.current = 0
  }

  return (
    <VoiceRecorderControls
      state={state}
      countdown={countdown}
      previewUrl={previewUrl}
      onStart={startRecording}
      onStop={stopRecording}
      onSubmit={submitRecording}
      onReset={resetRecording}
      errorMsg={errorMsg}
    />
  )
}
