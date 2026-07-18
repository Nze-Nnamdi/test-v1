"use client"

import React, { useState } from "react"
import { Footer } from "@/components/Footer"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { VoiceFeed } from "@/components/VoiceFeed"

export default function Home() {
  const [feedKey, setFeedKey] = useState(0)

  const handleRecordComplete = () => {
    setFeedKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow w-full max-w-sm mx-auto px-2 py-4 space-y-4 flex flex-col justify-center">
        <section aria-label="Public Voice Feed" className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Voices</h2>
          </div>
          <div className="p-3 pt-0">
            <VoiceFeed key={feedKey} />
          </div>
        </section>

        <section aria-label="Audio Recording Control">
          <VoiceRecorder onRecordComplete={handleRecordComplete} />
        </section>
      </main>
      <Footer />
    </div>
  )
}
