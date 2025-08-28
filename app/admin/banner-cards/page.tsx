"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BannerCardProps } from "@/components/banner-card"
import Image from "next/image"

export default function BannerCardsAdmin() {
  const [cards, setCards] = useState<BannerCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [currentCard, setCurrentCard] = useState<Partial<BannerCardProps>>({
    title: "",
    imageUrl: "",
    link: "",
    position: "top",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/banner-cards")
      if (!response.ok) throw new Error("Failed to fetch banner cards")
      const data = await response.json()
      setCards(data)
    } catch (error) {
      console.error("Error fetching banner cards:", error)
      toast({
        title: "Error",
        description: "Failed to fetch banner cards",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentCard((prev) => ({ ...prev, [name]: value }))
  }

  const handlePositionChange = (value: string) => {
    setCurrentCard((prev) => ({ ...prev, position: value as "top" | "middle" | "bottom" }))
  }

  const handleEditCard = (card: BannerCardProps) => {
    setCurrentCard(card)
  }

  const handleSaveCard = async () => {
    try {
      if (!currentCard.title || !currentCard.imageUrl || !currentCard.link || !currentCard.position) {
        toast({
          title: "Validation Error",
          description: "Please fill all the required fields",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/banner-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentCard),
      })

      if (!response.ok) throw new Error("Failed to save banner card")
      
      toast({
        title: "Success",
        description: "Banner card saved successfully",
      })
      
      fetchCards()
      resetForm()
    } catch (error) {
      console.error("Error saving banner card:", error)
      toast({
        title: "Error",
        description: "Failed to save banner card",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      const response = await fetch(`/api/banner-cards?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete banner card")
      
      toast({
        title: "Success",
        description: "Banner card deleted successfully",
      })
      
      fetchCards()
    } catch (error) {
      console.error("Error deleting banner card:", error)
      toast({
        title: "Error",
        description: "Failed to delete banner card",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setCurrentCard({
      title: "",
      imageUrl: "",
      link: "",
      position: "top",
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Banner Cards Management</h1>
          <p className="text-gray-500">
            Manage banner cards that appear on the homepage
          </p>
        </div>
        <Button onClick={fetchCards} variant="outline" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Banner Card Form */}
        <Card>
          <CardHeader>
            <CardTitle>{currentCard.id ? "Edit" : "Add"} Banner Card</CardTitle>
            <CardDescription>
              {currentCard.id ? "Update the" : "Create a new"} banner card
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={currentCard.title || ""}
                  onChange={handleInputChange}
                  placeholder="Enter banner title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={currentCard.imageUrl || ""}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
                {currentCard.imageUrl && (
                  <div className="relative w-full aspect-[21/9] mt-2 rounded-md overflow-hidden">
                    <Image
                      src={currentCard.imageUrl}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  name="link"
                  value={currentCard.link || ""}
                  onChange={handleInputChange}
                  placeholder="/category/fruits-vegetables"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Select 
                  value={currentCard.position} 
                  onValueChange={handlePositionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top (Above categories)</SelectItem>
                    <SelectItem value="middle">Middle (Below categories)</SelectItem>
                    <SelectItem value="bottom">Bottom (Above footer)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  On desktop, all cards will be displayed in a row above categories
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button onClick={handleSaveCard}>
              {currentCard.id ? "Update" : "Save"} Card
            </Button>
          </CardFooter>
        </Card>

        {/* Banner Cards List */}
        <Card>
          <CardHeader>
            <CardTitle>Banner Cards</CardTitle>
            <CardDescription>
              Current banner cards ({cards.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p>Loading...</p>
              ) : cards.length === 0 ? (
                <p>No banner cards found</p>
              ) : (
                cards.map((card) => (
                  <div
                    key={card.id}
                    className="border rounded-md p-4 flex flex-col md:flex-row gap-4"
                  >
                    <div className="relative w-full md:w-1/3 aspect-[16/9]">
                      <Image
                        src={card.imageUrl}
                        alt={card.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{card.title}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        Link: {card.link}
                      </p>
                      <div className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mt-2">
                        Position: {card.position}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCard(card)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 