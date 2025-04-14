"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllAgents } from "@/utils/filecoinUtils" // adjust path as needed

// Mock data for agents
const mockAgents = [
  {
    id: "1",
    name: "Research Assistant",
    description: "Helps with research tasks and finding relevant information from various sources.",
  },
  {
    id: "2",
    name: "Code Helper",
    description: "Assists with coding problems, debugging, and providing code examples.",
  },
  {
    id: "3",
    name: "Data Analyst",
    description: "Analyzes data and provides insights, visualizations, and recommendations.",
  },
  {
    id: "4",
    name: "Writing Assistant",
    description: "Helps with writing, editing, and improving content for various purposes.",
  },
  {
    id: "5",
    name: "Learning Companion",
    description: "Assists with learning new subjects and concepts through explanations and examples.",
  },
  {
    id: "6",
    name: "Task Manager",
    description: "Helps organize tasks, set reminders, and manage projects efficiently.",
  },
]

export default function AgentGrid() {
  const router = useRouter()
  // const [agents] = useState(mockAgents)
  const [agents, setAgents] = useState([])

  useEffect(() => {
    const fetchAgents = async () => {
      const data = await getAllAgents()
      setAgents(data)
    }
    fetchAgents()
  }, [])
  


  const handleAgentClick = (agentId: string) => {
    let data = null;
    for(const item of agents) {
      if(item?.id == agentId){
        data = item
      }
    }
    localStorage.setItem("selectedAgent", JSON.stringify(data))
    router.push(`/chat/${agentId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleAgentClick(agent.id)}
        >
          <CardHeader>
            <CardTitle>{agent.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{agent.description}</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">Click to chat</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
