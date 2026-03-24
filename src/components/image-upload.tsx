"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import Image from 'next/image'

interface ImageUploadProps {
  onUpload: (url: string) => void
  className?: string
}

export function ImageUpload({ onUpload, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    setIsUploading(true)
    try {
      // Upload file to local storage
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      onUpload(data.url)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"]
    },
    maxFiles: 1,
    multiple: false
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        isUploading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} disabled={isUploading} />
      {preview && (
        <div className="mt-4">
          <Image
            src={preview}
            alt="Preview"
            width={400}
            height={300}
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      )}
      {preview ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setPreview(null)
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {isDragActive ? (
              <p>Drop the image here</p>
            ) : (
              <p>Drag & drop an image here, or click to select</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 