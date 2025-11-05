/**
 * Generate unique ticket ID in format: TICK-XXXXX
 * Where XXXXX is 5 alphanumeric characters (uppercase letters and numbers)
 */
export function generateTicketId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let ticketId = 'TICK-'
  
  for (let i = 0; i < 5; i++) {
    ticketId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return ticketId
}

/**
 * Validate ticket ID format
 */
export function isValidTicketId(ticketId: string): boolean {
  const pattern = /^TICK-[A-Z0-9]{5}$/
  return pattern.test(ticketId)
}

