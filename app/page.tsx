import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CreateAgentForm from "@/components/create-agent-form"
import AgentGrid from "@/components/agent-grid"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-7xl">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="create">Create Agent</TabsTrigger>
          <TabsTrigger value="explore">Explore Agents</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <CreateAgentForm />
        </TabsContent>
        <TabsContent value="explore">
          <AgentGrid />
        </TabsContent>
      </Tabs>
    </main>
  )
}
