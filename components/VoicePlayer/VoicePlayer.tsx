import React, { useState, useRef, useEffect } from "react"

interface VoicePlayerProps {
  audioUrl: string
  duration: number
  noteId: string
  playCount: number
  showPlayCount: boolean
}

export function VoicePlayer({ audioUrl, duration, noteId, playCount, showPlayCount }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [count, setCount] = useState(playCount)
  const hasTrackedPlay = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback failed:", err)
      })
      setIsPlaying(true)

      if (!hasTrackedPlay.current) {
        hasTrackedPlay.current = true
        fetch("/api/voices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: noteId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.playCount !== undefined) setCount(data.playCount)
          })
          .catch(() => {})
      }
    }
  }

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60)
    const seconds = Math.floor(secs % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
      >
        {isPlaying ? (
          <svg
            className="w-3.5 h-3.5 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg
            className="w-3.5 h-3.5 fill-current ml-0.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-900">
          {isPlaying ? formatTime(currentTime) : formatTime(duration)}
        </span>
        {showPlayCount && count > 0 && (
          <span className="text-[10px] text-gray-400">
            {count} {count === 1 ? "play" : "plays"}
          </span>
        )}
      </div>
    </div>
  )
}
