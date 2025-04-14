"use client"

import Link from "next/link"
import { Bot } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Bot className="h-6 w-6" />
          <span className="font-bold text-xl">Custom Agent</span>
        </Link>
      </div>
    </nav>
  )
}
