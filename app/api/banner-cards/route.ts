import { NextResponse } from "next/server"

// In a production app, this would use a database
// For this implementation, we'll use a simple file-based approach

import fs from "fs"
import path from "path"

const dataFilePath = path.join(process.cwd(), "data", "banner-cards.json")

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Create the cards data file with default data if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
  const defaultCards = [
    {
      id: '1',
      title: 'Pizza & Burgers',
      imageUrl: 'https://img.freepik.com/premium-photo/flat-lay-arrangement-with-burgers-pizza_926199-1948802.jpg?w=1060s',
      link: '/category/fruits-vegetables',
      position: 'top'
    },
    {
      id: '2',
      title: 'Dairy Products',
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da',
      link: '/category/dairy-bread-eggs',
      position: 'middle'
    },
    {
      id: '3',
      title: 'Grocery & Staples',
      imageUrl: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818',
      link: '/category/grocery',
      position: 'bottom'
    }
  ]
  fs.writeFileSync(dataFilePath, JSON.stringify(defaultCards, null, 2))
}

export async function GET() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8')
    const bannerCards = JSON.parse(data)
    return NextResponse.json(bannerCards)
  } catch (error) {
    console.error('Error reading banner cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banner cards' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const card = await request.json()

    // Validate
    if (!card.title || !card.imageUrl || !card.link || !card.position) {
      return NextResponse.json(
        { error: 'Missing required fields: title, imageUrl, link, and position are required' },
        { status: 400 }
      )
    }

    // Read existing data
    const data = fs.readFileSync(dataFilePath, 'utf8')
    const bannerCards = JSON.parse(data)

    // Find if we're updating an existing position
    const existingIndex = bannerCards.findIndex((c: any) => c.position === card.position)

    if (card.id) {
      // Update existing card
      const cardIndex = bannerCards.findIndex((c: any) => c.id === card.id)
      if (cardIndex >= 0) {
        bannerCards[cardIndex] = card
      } else {
        // New card with specified ID
        if (existingIndex >= 0) {
          // Replace card at this position
          bannerCards[existingIndex] = card
        } else {
          // Add new card
          bannerCards.push(card)
        }
      }
    } else {
      // New card without ID
      card.id = Date.now().toString()

      if (existingIndex >= 0) {
        // Replace card at this position
        bannerCards[existingIndex] = card
      } else {
        // Add new card
        bannerCards.push(card)
      }
    }

    // Write back to file
    fs.writeFileSync(dataFilePath, JSON.stringify(bannerCards, null, 2))

    return NextResponse.json(card)
  } catch (error) {
    console.error('Error updating banner card:', error)
    return NextResponse.json(
      { error: 'Failed to update banner card' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing card ID' },
        { status: 400 }
      )
    }

    // Read existing data
    const data = fs.readFileSync(dataFilePath, 'utf8')
    const bannerCards = JSON.parse(data)

    const filteredCards = bannerCards.filter((card: any) => card.id !== id)

    // Write back to file
    fs.writeFileSync(dataFilePath, JSON.stringify(filteredCards, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner card:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner card' },
      { status: 500 }
    )
  }
} 