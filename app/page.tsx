"use client"

import React, { useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { VoiceFeed } from "@/components/VoiceFeed"

export default function Home() {
  const [feedKey, setFeedKey] = useState(0)

  const handleRecordComplete = () => {
    // Incrementing the key forces VoiceFeed to remount and fetch the updated list
    setFeedKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow w-full max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section aria-label="Audio Recording Control">
          <VoiceRecorder onRecordComplete={handleRecordComplete} />
        </section>
        
        <section aria-label="Public Voice Feed">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Voices</h2>
          <VoiceFeed refreshTrigger={feedKey} />
        </section>
      </main>
      <Footer />
    </div>
  )
}
