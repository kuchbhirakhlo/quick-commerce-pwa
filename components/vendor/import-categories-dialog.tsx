"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, AlertTriangle, Info } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { resolveApiUrl } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface ImportCategoriesDialogProps {
  onSuccess?: () => void
}

interface CategoryImport {
  name: string
  icon?: string
}

export default function ImportCategoriesDialog({ onSuccess }: ImportCategoriesDialogProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedData, setParsedData] = useState<CategoryImport[]>([])
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0
  })

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setParseError(null)
    setParsedData([])
    
    if (file) {
      // Validate file type
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setParseError("Please select a valid CSV file");
        return;
      }

      setCsvFile(file)
      parseCSV(file)
    }
  }

  // Parse CSV file
  const parseCSV = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        // Check if required columns exist
        if (!headers.includes('name')) {
          setParseError("CSV file must contain a 'name' column")
          return
        }
        
        const nameIndex = headers.indexOf('name')
        const iconIndex = headers.indexOf('icon')
        
        const categories: CategoryImport[] = []
        
        // Parse each line (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue // Skip empty lines
          
          const values = line.split(',').map(v => v.trim())
          
          const name = values[nameIndex]
          if (!name) continue // Skip entries without a name
          
          const category: CategoryImport = { name }
          
          // Add icon if available
          if (iconIndex !== -1 && values[iconIndex]) {
            category.icon = values[iconIndex]
          }
          
          categories.push(category)
        }
        
        setParsedData(categories)
        
        if (categories.length === 0) {
          setParseError("No valid categories found in the CSV file")
        }
      } catch (error: any) {
        console.error("CSV parsing error:", error)
        setParseError(`Failed to parse CSV: ${error.message || "Unknown error"}`)
      }
    }
    
    reader.onerror = () => {
      setParseError("Failed to read the CSV file")
    }
    
    reader.readAsText(file)
  }

  // Import categories
  const handleImportCategories = async () => {
    if (!parsedData.length) {
      toast({
        title: "Error",
        description: "No categories to import",
        variant: "destructive"
      })
      return
    }
    
    setIsUploading(true)
    setProgress(0)
    
    const stats = {
      total: parsedData.length,
      success: 0,
      failed: 0
    }
    
    try {
      // Process each category
      for (let i = 0; i < parsedData.length; i++) {
        const category = parsedData[i]
        
        try {
          let finalIconUrl = "/icons/grocery.svg"; // Default icon
          
          // If category has an icon URL, try to upload it
          if (category.icon && (category.icon.startsWith('http://') || category.icon.startsWith('https://'))) {
            try {
              // Try server-side upload first
              const apiUrl = resolveApiUrl('/api/upload')
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  imageUrl: category.icon,
                  vendorId: 'categories'
                })
              })
              
              const result = await response.json()
              
              if (result.success) {
                console.log(`Icon upload successful for category ${category.name}`)
                finalIconUrl = result.url
              } else if (result.error?.includes('404') || result.error?.includes('not found')) {
                // Try with proxy URL
                const proxyUrl = resolveApiUrl(`/api/proxy-image?url=${encodeURIComponent(category.icon)}`)
                const proxyResponse = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    imageUrl: proxyUrl,
                    vendorId: 'categories'
                  })
                })
                
                const proxyResult = await proxyResponse.json()
                
                if (proxyResult.success) {
                  finalIconUrl = proxyResult.url
                } else {
                  // If all fails, use the original URL
                  finalIconUrl = category.icon
                }
              } else {
                // If server-side fails, use the original URL
                finalIconUrl = category.icon
              }
            } catch (iconError) {
              console.error(`Error uploading icon for ${category.name}:`, iconError)
              // Use the original URL if upload fails
              finalIconUrl = category.icon
            }
          }
          
          // Create category document
          await addDoc(collection(db, "categories"), {
            name: category.name,
            icon: finalIconUrl,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          
          stats.success++
        } catch (err) {
          console.error(`Error adding category ${category.name}:`, err)
          stats.failed++
        }
        
        // Update progress
        const newProgress = Math.round(((i + 1) / parsedData.length) * 100)
        setProgress(newProgress)
      }
      
      setImportStats(stats)
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${stats.success} of ${stats.total} categories`,
        variant: stats.failed > 0 ? "destructive" : "default"
      })
      
      // Call the success callback
      if (onSuccess) {
        onSuccess()
      }
      
      // Close dialog after a delay
      if (stats.failed === 0) {
        setTimeout(() => {
          setIsDialogOpen(false)
          setCsvFile(null)
          setParsedData([])
        }, 2000)
      }
      
    } catch (err: any) {
      console.error("Error during import:", err)
      toast({
        title: "Error",
        description: `Import failed: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import Categories
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Categories</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple categories at once.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>CSV file should have columns: name (required), icon (optional URL)</span>
              <a 
                href="/templates/categories-template.csv" 
                download 
                className="text-primary underline text-sm hover:text-primary/80"
              >
                Download Template
              </a>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          
          {parseError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}
          
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <Label>Found {parsedData.length} categories to import</Label>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                <ul className="list-disc pl-5">
                  {parsedData.slice(0, 10).map((category, index) => (
                    <li key={index} className="text-sm">
                      {category.name} {category.icon ? `(with icon)` : ''}
                    </li>
                  ))}
                  {parsedData.length > 10 && (
                    <li className="text-sm text-muted-foreground">
                      ...and {parsedData.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing categories...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {!isUploading && importStats.total > 0 && (
            <Alert variant={importStats.failed > 0 ? "destructive" : "default"}>
              <AlertDescription>
                Imported {importStats.success} of {importStats.total} categories
                {importStats.failed > 0 && ` (${importStats.failed} failed)`}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isUploading}>Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleImportCategories} 
            disabled={isUploading || parsedData.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import {parsedData.length} Categories
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 