import React from "react"

interface VoiceRecorderControlsProps {
  state: "idle" | "recording" | "review" | "submitting" | "success" | "error"
  countdown: number
  onStart: () => void
  onStop: () => void
  onSubmit: () => void
  onReset: () => void
  errorMsg?: string
}

export function VoiceRecorderControls({
  state,
  countdown,
  onStart,
  onStop,
  onSubmit,
  onReset,
  errorMsg,
}: VoiceRecorderControlsProps) {
  const formatCountdown = (secs: number) => {
    const minutes = Math.floor(secs / 60)
    const seconds = secs % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }

  const isUnderTenSeconds = countdown <= 10

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
        <span className="mr-2" role="img" aria-label="Microphone">🎤</span>
        Record Note
      </h2>

      {state === "idle" && (
        <button
          type="button"
          onClick={onStart}
          aria-label="Start recording voice note"
          className="w-full max-w-xs h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start Recording
        </button>
      )}

      {state === "recording" && (
        <div className="w-full flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse" />
            <span
              className={`text-3xl font-semibold transition-colors duration-150 ${
                isUnderTenSeconds ? "text-red-600" : "text-gray-700"
              }`}
            >
              {formatCountdown(countdown)}
            </span>
          </div>
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop recording voice note"
            className="w-full max-w-xs h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Stop Recording
          </button>
        </div>
      )}

      {state === "review" && (
        <div className="w-full flex flex-col items-center space-y-3">
          <p className="text-sm font-medium text-gray-600">Recording complete!</p>
          <div className="w-full flex space-x-3 max-w-xs">
            <button
              type="button"
              onClick={onReset}
              aria-label="Discard and record again"
              className="flex-1 h-12 flex items-center justify-center bg-transparent border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onSubmit}
              aria-label="Submit voice note"
              className="flex-1 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {state === "submitting" && (
        <div className="w-full flex flex-col items-center py-2 space-y-3">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
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
          <p className="text-sm font-medium text-gray-500">Uploading note...</p>
        </div>
      )}

      {state === "success" && (
        <div className="w-full flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold">
            ✓
          </div>
          <p className="text-sm font-semibold text-green-600">
            Voice note uploaded successfully!
          </p>
          <button
            type="button"
            onClick={onReset}
            className="w-full max-w-xs h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Record New Note
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="w-full flex flex-col items-center space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center max-w-xs">
            <p className="text-xs text-red-600 font-medium">
              {errorMsg || "Upload failed. Please check file type/size limits."}
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="w-full max-w-xs h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
