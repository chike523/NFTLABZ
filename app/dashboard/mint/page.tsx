"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Image as ImageIcon, X, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { nftQueries, categoryQueries } from "@/lib/queries"
import { toast } from "@/components/ui/use-toast"

export default function MintPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priceEth, setPriceEth] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [royaltyPercentage, setRoyaltyPercentage] = useState("10")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const { data, error } = await categoryQueries.getEnabledCategories()
        if (!error && data) {
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Invalid file type. Please upload PNG, JPG, GIF, or WEBP.' }))
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, image: 'File too large. Maximum size is 10MB.' }))
      return
    }

    // Clear error and set file
    setErrors(prev => ({ ...prev, image: '' }))
    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (title.length > 200) {
      newErrors.title = 'Title must not exceed 200 characters'
    }

    if (description.length > 2000) {
      newErrors.description = 'Description must not exceed 2000 characters'
    }

    if (!priceEth.trim()) {
      newErrors.price = 'Price is required'
    } else {
      const price = parseFloat(priceEth)
      if (isNaN(price) || price <= 0) {
        newErrors.price = 'Price must be greater than 0'
      }
    }

    if (!categoryId) {
      newErrors.category = 'Category is required'
    }

    if (!imageFile) {
      newErrors.image = 'NFT image is required'
    }

    const royalty = parseFloat(royaltyPercentage)
    if (isNaN(royalty) || royalty < 0 || royalty > 50) {
      newErrors.royalty = 'Royalty must be between 0 and 50'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to mint NFTs",
        variant: "destructive"
      })
      return
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Step 1: Upload image
      const formData = new FormData()
      formData.append('file', imageFile!)
      formData.append('folder', 'nfts')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const uploadData = await uploadResponse.json()
      const imageUrl = uploadData.url

      // Step 2: Create NFT record
      const nftData = {
        title: title.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl,
        category_id: categoryId,
        price_eth: parseFloat(priceEth),
        royalty_percentage: parseFloat(royaltyPercentage)
      }

      const { data: nft, error } = await nftQueries.createNFT(user.id, nftData)

      if (error) {
        throw new Error(error)
      }

      // Success!
      toast({
        title: "Success!",
        description: "Your NFT has been submitted for admin approval. You'll be notified once it's reviewed.",
      })

      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push('/dashboard/profile')
      }, 1500)

    } catch (error) {
      console.error('Error minting NFT:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to mint NFT. Please try again.',
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mint NFT</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Create and mint your unique NFT. It will be reviewed by our team before going live.
          </p>
        </div>

        {/* Mint Form */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                NFT Image <span className="text-destructive">*</span>
              </label>
              
              {!imagePreview ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="nft-image-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="nft-image-upload"
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer block"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG, GIF, WEBP up to 10MB</p>
                  </label>
                </div>
              ) : (
                <div className="relative border border-border rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="NFT Preview"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={loading}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {errors.image && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.image}</span>
                </div>
              )}
            </div>

            {/* NFT Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  NFT Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Enter NFT name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.title}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Price (ETH) <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceEth}
                  onChange={(e) => setPriceEth(e.target.value)}
                  disabled={loading}
                  className={errors.price ? 'border-destructive' : ''}
                />
                {errors.price && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.price}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                placeholder="Describe your NFT..."
                className="min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/2000 characters
              </p>
              {errors.description && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.description}</span>
                </div>
              )}
            </div>

            {/* Properties */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Properties</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Category <span className="text-destructive">*</span>
                  </label>
                  {loadingCategories ? (
                    <div className="h-10 bg-muted animate-pulse rounded-lg" />
                  ) : (
                    <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                      <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon && <span className="mr-2">{category.icon}</span>}
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.category && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.category}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Royalty (%)
                  </label>
                  <Input
                    placeholder="10"
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={royaltyPercentage}
                    onChange={(e) => setRoyaltyPercentage(e.target.value)}
                    disabled={loading}
                    className={errors.royalty ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Earn royalties on future sales (0-50%)
                  </p>
                  {errors.royalty && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.royalty}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    NFT Approval Process
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your NFT will be submitted for admin approval. Once approved, it will be visible on the marketplace. 
                    You can track the status in your NFT Profile page.
                  </p>
                </div>
              </div>
            </div>

            {/* Mint Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting NFT...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Mint NFT
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
