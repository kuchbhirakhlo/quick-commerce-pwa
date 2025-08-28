"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Upload } from "lucide-react"
import { uploadProductImage, uploadImageFromUrl, checkUploadConfig } from "@/lib/upload"

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [configStatus, setConfigStatus] = useState<any>(null)
  const [isCheckingConfig, setIsCheckingConfig] = useState(false)

  // Check upload configuration on component mount
  useEffect(() => {
    checkConfig()
  }, [])

  // Function to check upload configuration
  const checkConfig = async () => {
    setIsCheckingConfig(true)
    try {
      const status = await checkUploadConfig()
      console.log("Upload configuration status:", status)
      setConfigStatus(status)
    } catch (err) {
      console.error("Error checking upload configuration:", err)
    } finally {
      setIsCheckingConfig(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
  }

  const handleFileUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    setUploadResult(null)
    
    try {
      const result = await uploadProductImage(file, 'test-vendor')
      console.log("Upload result:", result)
      setUploadResult(result)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadResult({ success: false, error })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlUpload = async () => {
    if (!imageUrl) return
    
    setIsUploading(true)
    setUploadResult(null)
    
    try {
      const result = await uploadImageFromUrl(imageUrl, 'test-vendor')
      console.log("URL upload result:", result)
      setUploadResult(result)
    } catch (error) {
      console.error("URL upload error:", error)
      setUploadResult({ success: false, error })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Service Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Configuration Status</CardTitle>
            <CardDescription>Check if upload services are properly configured</CardDescription>
          </CardHeader>
          <CardContent>
            {isCheckingConfig ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking configuration...</span>
              </div>
            ) : configStatus ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Primary Service: {configStatus.primaryService}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">Cloudinary:</p>
                  <div className="flex items-center gap-2">
                    {configStatus.cloudinary.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>
                      {configStatus.cloudinary.configured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                  {configStatus.cloudinary.error && (
                    <p className="text-sm text-red-500">{configStatus.cloudinary.error.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">Firebase Storage:</p>
                  <div className="flex items-center gap-2">
                    {configStatus.firebase.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>
                      {configStatus.firebase.configured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                  {configStatus.firebase.error && (
                    <p className="text-sm text-red-500">{configStatus.firebase.error.message}</p>
                  )}
                </div>
                
                <Button onClick={checkConfig}>Refresh Status</Button>
              </div>
            ) : (
              <Button onClick={checkConfig}>Check Configuration</Button>
            )}
          </CardContent>
        </Card>
        
        {/* File Upload Test */}
        <Card>
          <CardHeader>
            <CardTitle>File Upload Test</CardTitle>
            <CardDescription>Test uploading a file using the unified upload service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input 
                  type="file" 
                  onChange={handleFileChange} 
                  accept="image/*"
                  disabled={isUploading}
                />
              </div>
              
              <Button 
                onClick={handleFileUpload} 
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* URL Upload Test */}
        <Card>
          <CardHeader>
            <CardTitle>URL Upload Test</CardTitle>
            <CardDescription>Test uploading an image from a URL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input 
                  type="url" 
                  placeholder="Enter image URL" 
                  value={imageUrl}
                  onChange={handleUrlChange}
                  disabled={isUploading}
                />
              </div>
              
              <Button 
                onClick={handleUrlUpload} 
                disabled={!imageUrl || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload from URL
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Upload Result */}
        {uploadResult && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Upload Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant={uploadResult.success ? "default" : "destructive"}>
                  <AlertTitle>
                    {uploadResult.success ? "Upload Successful" : "Upload Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {uploadResult.success
                      ? `Successfully uploaded using ${uploadResult.provider}`
                      : uploadResult.errorMessage || "Unknown error"}
                  </AlertDescription>
                </Alert>
                
                {uploadResult.success && (
                  <div className="space-y-2">
                    <p><strong>Provider:</strong> {uploadResult.provider}</p>
                    <p><strong>URL:</strong> {uploadResult.url}</p>
                    {uploadResult.public_id && (
                      <p><strong>Public ID:</strong> {uploadResult.public_id}</p>
                    )}
                    {uploadResult.path && (
                      <p><strong>Path:</strong> {uploadResult.path}</p>
                    )}
                    <div className="mt-4">
                      <img 
                        src={uploadResult.url} 
                        alt="Uploaded" 
                        className="max-h-64 rounded-md" 
                      />
                    </div>
                  </div>
                )}
                
                <details>
                  <summary className="cursor-pointer text-sm text-gray-500">
                    View Raw Result
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto text-xs">
                    {JSON.stringify(uploadResult, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 