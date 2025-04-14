"use client"

import { notFound } from "next/navigation"
import ChatInterface from "@/components/chat/chat-interface"
import { useEffect, useState } from "react"
// Mock function to get agent data
// const getAgent = (id: string) => {
//   // This would be a database call in a real app
//   const agents = [
//     { id: "0", name: "Research Assistant", description: "Helps with research tasks" },
//     { id: "1", name: "Code Helper", description: "Assists with coding problems" },
//     { id: "2", name: "Data Analyst", description: "Analyzes data and provides insights" },
//   ]

//   return agents.find((agent) => agent.id === id)
// }

export default function ChatPage({ params }: { params: Promise<{ agentId: string }> }) {
  const [agent, setAgent] = useState<any>(null)

  // Unwrap the Promise from `params` and retrieve agent from localStorage
  useEffect(() => {
    params.then((resolvedParams) => {
      const agentId = resolvedParams.agentId
      const storedAgent = localStorage.getItem("selectedAgent")

      if (storedAgent) {
        const parsedAgent = JSON.parse(storedAgent)
        if (parsedAgent.id == agentId) {
          console.log("storedAgent " , storedAgent)
          setAgent(parsedAgent) // Set agent data
        }
      }
    })
  }, [params])

  if (!agent) {
    return <p>Loading...</p>
  }


  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{agent.name}</h1>
      <p className="text-muted-foreground mb-6">{agent.description}</p>
      <ChatInterface agentId={agent.id} dataList={agent.datasetList} />
    </div>
  )
}
