import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Echoes — Voice notes from strangers",
  description: "Record short voice notes and share them anonymously in a public space. Discover and listen to voice messages from people around the world.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
