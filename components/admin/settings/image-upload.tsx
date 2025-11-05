"use client"

import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  placeholder?: string
  className?: string
  accept?: string
  maxSize?: number // in MB
  folder?: string // upload folder
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove,
  placeholder = "Click to upload image",
  className,
  accept = "image/*",
  maxSize = 5,
  folder = "nfts"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    try {
      setUploading(true)
      
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      const { url } = await response.json()
      onChange(url)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onRemove?.()
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "hover:border-gray-400 hover:bg-gray-50/5",
          error ? "border-red-500" : "border-gray-600",
          uploading && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
          disabled={uploading}
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 mx-auto rounded"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            ) : (
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
            )}
            <p className="text-sm text-gray-400">
              {uploading ? 'Uploading...' : placeholder}
            </p>
            <p className="text-xs text-gray-500">
              Drag and drop or click to select (max {maxSize}MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {value && !preview && (
        <div className="flex items-center space-x-2">
          <ImageIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400 truncate">{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

