"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, LinkIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { uploadToFilecoinLighthouse, uploadJsonToFilecoinLighthouse } from "@/utils/filecoinUtils"


export default function CreateAgentForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [fileUrls, setFileUrls] = useState<{ file: File | null; url: string; storage: string }[]>([])
  const [link, setLink] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddLink = () => {
    if (link.trim()) {
      // In a real app, you would validate the link
      setLink("")
      // Add logic to handle the link
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    let hashList = [] 

    for (const fileData of fileUrls) {
      if (fileData.file ) {
        let response = await uploadToFilecoinLighthouse(fileData.file)
        hashList.push(response.data.Hash)
      }
    }
    
    // Prepare the agent data
    let agentData = {
      agentName: name,
      agentDescription: description,
      datasetList: hashList
    }

    // Call the uploadJsonToIPFS function to upload the agent data as JSON
    const uploadResponse = await uploadJsonToFilecoinLighthouse(agentData)


    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      // In a real app, you would save the agent data to a database
      // and redirect to the agent's page
      router.push("/")
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter agent name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Agent Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what your agent does"
          rows={4}
          required
        />
      </div>

      <div className="space-y-4">
        <Label>Knowledge Files</Label>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="link" disabled>Add Link</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFileUrls([...fileUrls, { file: null, url: "", storage: "Filecoin" }])
              }}
              className="flex items-center"
            >
              <span className="mr-1">+</span> Add Data Doc
            </Button>

            {fileUrls.length > 0 && (
              <div className="space-y-4 mt-4">
                {fileUrls.map((fileData, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 border rounded-md bg-muted/30"
                  >
                    <div className="flex-1">
                      <Input
                        type="file"
                        className="w-full"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const newFileUrls = [...fileUrls]
                            const file = e.target.files[0]
                            newFileUrls[index] = {
                              file,
                              url: URL.createObjectURL(file),
                              storage: newFileUrls[index].storage,
                            }
                            setFileUrls(newFileUrls)

                            // Update files array too
                            const newFiles = [...files]
                            if (newFiles[index]) {
                              newFiles[index] = file
                            } else {
                              newFiles.push(file)
                            }
                            setFiles(newFiles)
                          }
                        }}
                      />
                      {fileData.file && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {fileData.file.name} ({(fileData.file.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={fileData.storage}
                        onValueChange={(value) => {
                          const newFileUrls = [...fileUrls]
                          newFileUrls[index].storage = value
                          setFileUrls(newFileUrls)
                        }}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Storage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Filecoin">Filecoin</SelectItem>
                          <SelectItem value="Akave">Akave</SelectItem>
                          <SelectItem value="CoopHive">CoopHive</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newFileUrls = [...fileUrls]
                          if (newFileUrls[index].file) {
                            URL.revokeObjectURL(newFileUrls[index].url)
                          }
                          newFileUrls.splice(index, 1)
                          setFileUrls(newFileUrls)

                          const newFiles = [...files]
                          newFiles.splice(index, 1)
                          setFiles(newFiles)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* <TabsContent value="link" className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                />
              </div>
              <Button type="button" onClick={handleAddLink}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </div>
          </TabsContent> */}
        </Tabs>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating Agent..." : "Create Agent"}
      </Button>
    </form>
  )
}
