import Header from "@/components/header"
import CategoryNav from "@/components/category-nav"
import CategoryHeader from "@/components/category-header"
import NFTGrid from "@/components/nft-grid"
import Pagination from "@/components/pagination"
import Footer from "@/components/footer"
import { nftQueries, categoryQueries } from "@/lib/queries"
import { convertEthToUsdt, formatCurrency, formatEth, getEthToUsdtRate } from "@/lib/utils/currency"
import { getCategoryStats } from "@/lib/queries/category-stats"

export default async function GamingPage() {
  const slug = 'gaming'
  const { data: category, error: categoryError } = await categoryQueries.getCategoryBySlug(slug)
  const rate = await getEthToUsdtRate().catch(() => null)

  if (categoryError || !category) {
    return (
      <main className="min-h-screen bg-background" suppressHydrationWarning>
        <Header />
        <CategoryNav />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Category not found</h1>
            <p className="text-muted-foreground mt-2">The requested category could not be found.</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const { data: nfts } = await nftQueries.getNFTsByCategory(slug, 20, 0)
  const stats = await getCategoryStats(slug)
  
  const items = (nfts || []).map(nft => {
    const ethValue = nft.price_eth ?? nft.floor_price_eth ?? 0
    const usdtValue = convertEthToUsdt(ethValue, rate ?? undefined) ?? 0

    return {
      id: nft.id,
      title: nft.title,
      artist: nft.creator?.username || nft.creator?.display_name || "Unknown Artist",
      image: nft.image_url,
      price: formatEth(ethValue),
      priceUSD: formatCurrency(usdtValue),
    }
  })

  const categoryStats = {
    name: category.name,
    items: stats.totalItems,
    chain: "Ethereum",
    totalVolume: `${formatEth(stats.totalVolume)} ETH`,
    listed: `${stats.listedCount} NFTs`,
    owners: stats.uniqueOwners,
    uniqueOwners: `${stats.uniqueOwners}`,
    description: category.description || "Explore gaming NFTs and digital collectibles"
  }

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Header />
      <CategoryNav />
      <CategoryHeader 
        category={categoryStats} 
        backgroundImage="/cyberpunk-tv-head-mask-horns.jpg"
        floatingImage="/futuristic-robot-mech-warrior.jpg"
      />
      <NFTGrid items={items} />
      <Pagination currentPage={1} totalPages={Math.ceil(category.nft_count / 20)} />
      <Footer />
    </main>
  )
}
