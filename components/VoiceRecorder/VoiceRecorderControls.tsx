import React, { useState, useRef, useEffect } from "react"

interface VoiceRecorderControlsProps {
  state: "idle" | "recording" | "review" | "submitting" | "success" | "error"
  countdown: number
  previewUrl?: string | null
  onStart: () => void
  onStop: () => void
  onSubmit: () => void
  onReset: () => void
  errorMsg?: string
}

export function VoiceRecorderControls({
  state,
  countdown,
  previewUrl,
  onStart,
  onStop,
  onSubmit,
  onReset,
  errorMsg,
}: VoiceRecorderControlsProps) {
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60)
    const seconds = Math.floor(secs % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const isUnderTenSeconds = countdown <= 10

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [waveform, setWaveform] = useState<number[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const BAR_COUNT = 48

  useEffect(() => {
    if (!previewUrl) {
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setWaveform([])
      return
    }

    const audio = new Audio(previewUrl)
    audioRef.current = audio

    const handleLoaded = () => setDuration(audio.duration)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("loadedmetadata", handleLoaded)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.load()

    let cancelled = false

    const extractWaveform = async () => {
      try {
        const response = await fetch(previewUrl)
        const arrayBuffer = await response.arrayBuffer()
        const ac = new AudioContext()
        const buffer = await ac.decodeAudioData(arrayBuffer)
        if (cancelled) { ac.close(); return }

        const channelData = buffer.getChannelData(0)
        const samplesPerBar = Math.floor(channelData.length / BAR_COUNT)
        const data: number[] = []

        for (let i = 0; i < BAR_COUNT; i++) {
          const start = i * samplesPerBar
          let max = 0
          for (let j = start; j < start + samplesPerBar; j++) {
            const abs = Math.abs(channelData[j])
            if (abs > max) max = abs
          }
          data.push(max)
        }

        if (!cancelled) setWaveform(data)
        ac.close()
      } catch (e) {
        console.error("Waveform extraction failed:", e)
      }
    }

    extractWaveform()

    return () => {
      cancelled = true
      audio.pause()
      audio.removeEventListener("loadedmetadata", handleLoaded)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audioRef.current = null
    }
  }, [previewUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false))
      setIsPlaying(true)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">

      {state === "idle" && (
        <button
          type="button"
          onClick={onStart}
          aria-label="Start recording voice note"
          className="w-full max-w-[180px] h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
        >
          Start Recording
        </button>
      )}

      {state === "recording" && (
        <div className="w-full flex flex-col items-center space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <span
              className={`text-lg font-semibold transition-colors duration-150 ${
                isUnderTenSeconds ? "text-red-600" : "text-gray-700"
              }`}
            >
              {formatTime(countdown)}
            </span>
          </div>
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop recording voice note"
            className="w-full max-w-[180px] h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
          >
            Stop Recording
          </button>
        </div>
      )}

      {state === "review" && (
        <div className="w-full flex flex-col items-center space-y-2">
          <p className="text-xs font-medium text-gray-600">Recording complete!</p>

          {previewUrl && (
            <div className="w-full max-w-[220px] bg-gray-50 border border-gray-200 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause preview" : "Play preview"}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
                >
                  {isPlaying ? (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <span className="text-[10px] text-gray-500 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex items-end h-8 mt-1 gap-[2px]">
                {waveform.length > 0 ? (
                  waveform.map((value, i) => {
                    const playHead = duration > 0 ? (currentTime / duration) * waveform.length : 0
                    const isPlayed = i <= playHead
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-colors duration-75"
                        style={{
                          height: `${Math.max(6, value * 85)}%`,
                          backgroundColor: isPlayed ? "#2563eb" : "#d1d5db",
                        }}
                      />
                    )
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse w-3 h-3 rounded-full bg-gray-300" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="w-full flex space-x-2 max-w-[220px]">
            <button
              type="button"
              onClick={onReset}
              aria-label="Discard and record again"
              className="flex-1 h-9 flex items-center justify-center bg-transparent border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 text-xs"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onSubmit}
              aria-label="Submit voice note"
              className="flex-1 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-xs"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {state === "submitting" && (
        <div className="w-full flex flex-col items-center py-1 space-y-2">
          <svg
            className="animate-spin h-6 w-6 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-xs font-medium text-gray-500">Uploading note...</p>
        </div>
      )}

      {state === "success" && (
        <div className="w-full flex flex-col items-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-base font-bold">
            ?
          </div>
          <p className="text-xs font-semibold text-green-600">
            Voice note uploaded successfully!
          </p>
          <button
            type="button"
            onClick={onReset}
            className="w-full max-w-[180px] h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
          >
            Record New Note
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="w-full flex flex-col items-center space-y-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center max-w-[220px]">
            <p className="text-[10px] text-red-600 font-medium">
              {errorMsg || "Upload failed. Please check file type/size limits."}
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="w-full max-w-[180px] h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 text-xs"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
