import { createClient } from '@/lib/supabase/server'

export interface CategoryStats {
  totalVolume: number // in ETH
  listedCount: number
  uniqueOwners: number
  totalItems: number
}

export async function getCategoryStats(categorySlug: string): Promise<CategoryStats> {
  const supabase = await createClient()

  try {
    // Get all approved NFTs for this category
    const { data: nfts, error: nftsError } = await supabase
      .from('nfts')
      .select(`
        id,
        owner_id,
        price_eth,
        category:categories!inner(slug)
      `)
      .eq('status', 'approved')
      .eq('categories.slug', categorySlug)

    if (nftsError) {
      console.error('Error fetching NFTs for stats:', nftsError)
      return {
        totalVolume: 0,
        listedCount: 0,
        uniqueOwners: 0,
        totalItems: 0
      }
    }

    const nftList = nfts || []
    const totalItems = nftList.length

    // Calculate listed count (NFTs with price > 0)
    const listedCount = nftList.filter(nft => 
      nft.price_eth !== null && nft.price_eth > 0
    ).length

    // Calculate unique owners
    const uniqueOwnerIds = new Set(nftList.map(nft => nft.owner_id))
    const uniqueOwners = uniqueOwnerIds.size

    // Calculate total volume as sum of all NFT prices in the category
    const totalVolume = nftList.reduce((sum, nft) => {
      const price = nft.price_eth || 0
      return sum + price
    }, 0)

    return {
      totalVolume,
      listedCount,
      uniqueOwners,
      totalItems
    }
  } catch (error) {
    console.error('Error calculating category stats:', error)
    return {
      totalVolume: 0,
      listedCount: 0,
      uniqueOwners: 0,
      totalItems: 0
    }
  }
}

