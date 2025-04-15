"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import MessageList from "./message-list"
import { getTextfromFilecoin } from "@/utils/filecoinUtils"
import {getRelevantData} from "@/utils/similaritySearch"
import {uploadFileToStoracha} from "@/utils/storach"
import { gemini } from "@/utils/gemini"  // Import the gemini function
import {lilypadAgent} from "@/utils/lilypad"

function ensurePromptLength(prompt: string, maxLength: number): string {
  if (prompt.length > maxLength) {
    return prompt.slice(0, maxLength); // Crop the prompt to maxLength
  }
  return prompt; // Return the prompt as is if within the limit
}

function createJsonFileFromObject(obj: object, fileName: string = "data.json"): File {
  const jsonString = JSON.stringify(obj, null, 2) // Pretty print with indentation
  const blob = new Blob([jsonString], { type: "application/json" })
  return new File([blob], fileName, { type: "application/json" })
}

type Message = {
  id: string
  content: string
  sender: "user" | "agent"
  timestamp: Date
}

export default function ChatInterface({ agentId, dataList }: { agentId: string, dataList: any[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! How can I assist you today?",
      sender: "agent",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isWaiting, setIsWaiting] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Simulate agent response
  // const simulateAgentResponse = async (userMessage: string) => {
  //   setIsWaiting(true)

  //   // Simulate typing delay
  //   setTimeout(() => {
  //     const responses = [
  //       "I understand your question. Let me think about that...",
  //       "That's an interesting point. Here's what I found...",
  //       "Based on my knowledge, I can provide the following information...",
  //       "I've analyzed your request and here's my response...",
  //       "Thank you for your message. I'd be happy to help with that.",
  //     ]

  //     // const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  //     const agentReply = await gemini(userMessage)
  //     setMessages((prev) => [
  //       ...prev,
  //       {
  //         id: Date.now().toString(),
  //         content: agentReply,
  //         sender: "agent",
  //         timestamp: new Date(),
  //       },
  //     ])

  //     setIsWaiting(false)
  //   }, 1500)
  // }

  const handleAgentResponse = async (userMessage: string) => {
    setIsWaiting(true)
  
    try {
      let sourceDataList = []
      for (const cid of dataList){
        const docData = await getTextfromFilecoin(cid);
        const sourceData = {
          sourceLink:`${cid}`, /// https://gateway.lighthouse.storage/ipfs/
          data: docData
        }
        sourceDataList.push(sourceData)
      }
      let  releventData = await getRelevantData(sourceDataList, userMessage)
      
      releventData= JSON.stringify(releventData)

      releventData = ensurePromptLength(releventData as string, 10000)

      const finalPrompt = `
        this is user question : ${userMessage}.

        This is relevent data to answer the question (if relevent data is not there then answer as per your knowledge):
        ${releventData}

        at the end of the answer, 
        If you use the relevant data to answer the question, include the source in this format on a new line at the end: ipfs source link: <link>  , but make sure there are **exactly two newlines** before the link.  
        If the relevant data is **not used**, do not include any source link. 
      `

      let agentReply =""
      if(process.env.NEXT_PUBLIC_LILYPAD_API_KEY){
        agentReply = await lilypadAgent("llama3.1:8b", finalPrompt);

        if(!agentReply) {
          
          agentReply = await lilypadAgent("deepseek-r1:7b", finalPrompt);
        }
      }
      else  agentReply = await gemini(finalPrompt) // Replace the simulation logic with this call
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: agentReply,
          sender: "agent",
          timestamp: new Date(),
        },
      ])


      // store the agent data to storach
      
      const dataToStoreOnStorach = {
        "input": userMessage,
        "output": agentReply,
        "relevent_data_gained_rag": releventData
      }
      
      if(process.env.NEXT_PUBLIC_STORACHA_SPACE_DID){

        const agentStorachFile =  createJsonFileFromObject(dataToStoreOnStorach, `${agentId}.json`)
        await uploadFileToStoracha(agentStorachFile)
      }
      
    } catch (error) {
      console.error("Error generating response:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Sorry, I encountered an error. Please try again.",
          sender: "agent",
          timestamp: new Date(),
        },
      ])
    }
  
    setIsWaiting(false)
  }
  

  const handleSendMessage = async () => {
    if (input.trim() === "" || isWaiting) return

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    await handleAgentResponse(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] rounded-2xl shadow-md bg-muted/50 overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <MessageList messages={messages} />
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isWaiting}
            className="resize-none"
            rows={1}
          />
          <Button onClick={handleSendMessage} disabled={input.trim() === "" || isWaiting} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isWaiting && <p className="text-xs text-muted-foreground mt-2">Agent is typing...</p>}
      </div>
    </div>
  )
}
