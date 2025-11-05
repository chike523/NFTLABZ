// Export all query classes and instances
export * from './nfts'
export * from './transactions'
export * from './users'
export * from './categories'
export * from './notifications'

// Re-export commonly used instances
export { nftQueries } from './nfts'
export { transactionQueries, nftActivityQueries } from './transactions'
export { userQueries, socialQueries } from './users'
export { categoryQueries, collectionQueries } from './categories'
export { notificationQueries, notificationHelpers } from './notifications'
export { adminQueries } from './admin'
