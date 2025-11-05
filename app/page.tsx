import Header from "@/components/header"
import CategoryNav from "@/components/category-nav"
import HeroCarousel from "@/components/hero-carousel"
import ArtSection from "@/components/art-section"
import Footer from "@/components/footer"
import { nftQueries, categoryQueries } from "@/lib/queries"
import { convertEthToUsdt, formatCurrency, formatEth, getEthToUsdtRate } from "@/lib/utils/currency"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  // Fetch dynamic settings
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/settings?public=true`, {
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      const settings: Record<string, any> = {}
      data.data?.forEach((setting: any) => {
        settings[setting.key] = setting.value
      })
      
      const metaTitle = settings.meta_title || 'NFT Marketplace - Digital Art Platform'
      const metaDescription = settings.meta_description || 'Discover and collect extraordinary NFTs'
      
      return {
        title: metaTitle,
        description: metaDescription,
        openGraph: {
          title: metaTitle,
          description: metaDescription,
          type: "website",
        },
      }
    }
  } catch (error) {
    console.error('Error fetching settings for metadata:', error)
  }
  
  // Fallback metadata
  return {
    title: "NFT Marketplace - Digital Art Platform",
    description: "Discover and collect extraordinary NFTs",
    openGraph: {
      title: "NFT Marketplace - Digital Art Platform",
      description: "Discover and collect extraordinary NFTs",
      type: "website",
    },
  }
}

export default async function Home() {
  const ratePromise = getEthToUsdtRate().catch(() => null)

  // Fetch featured NFTs and categories
  const [featuredNFTsResult, categoriesResult, ethToUsdtRate] = await Promise.all([
    nftQueries.getFeaturedNFTs(6),
    categoryQueries.getEnabledCategories(),
    ratePromise
  ])

  const featuredNFTs = featuredNFTsResult.data || []
  const categories = categoriesResult.data || []

  const featuredCategorySlugs = [
    'arts',
    'gaming',
    'membership',
    'pfps',
    'photography',
    'exhibition'
  ]

  const featuredCategories = featuredCategorySlugs
    .map((slug) => categories.find((category: any) => category.slug === slug))
    .filter((category): category is typeof categories[number] => Boolean(category))

  // Fetch NFTs for each featured category
  const categoryNFTs = await Promise.all(
    featuredCategories.map(async (category) => {
      const { data: nfts } = await nftQueries.getNFTsByCategory(category.slug, 4, 0)
      return {
        category,
        nfts: nfts || []
      }
    })
  )

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Header />
      <CategoryNav />
      <HeroCarousel featuredNFTs={featuredNFTs} />

      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-12" suppressHydrationWarning>
        {categoryNFTs.map(({ category, nfts }) => (
          <ArtSection 
            key={category.id} 
            title={category.name} 
            items={nfts.map(nft => ({
              id: nft.id,
              title: nft.title,
              image: nft.image_url,
              floorPrice: formatEth(nft.price_eth ?? nft.floor_price_eth ?? 0),
              usdtPrice: formatCurrency(
                convertEthToUsdt(nft.price_eth ?? nft.floor_price_eth ?? 0, ethToUsdtRate ?? undefined) ?? 0
              ),
              category: category.name,
              owner: nft.owner?.username || "Unknown"
            }))} 
          />
        ))}
      </div>
      
      <Footer />
    </main>
  )
}

