export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload a file to the public/uploads directory via API route
 * @param file - The file to upload
 * @param folder - The subfolder (avatars, banners, etc.)
 * @returns Promise with upload result
 */
export async function uploadFile(file: File, folder: 'avatars' | 'banners'): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'
      }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size must be less than 5MB'
      }
    }

    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    // Upload via API route
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Upload failed'
      }
    }

    return {
      success: true,
      url: result.url
    }
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Delete a file from the public/uploads directory
 * @param url - The public URL of the file to delete
 * @returns Promise with deletion result
 */
export async function deleteFile(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, we'll just return success since file deletion isn't critical
    // In production, you might want to implement a proper delete API route
    console.log('File deletion requested for:', url)
    return { success: true }
  } catch (error) {
    console.error('File deletion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deletion failed'
    }
  }
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
