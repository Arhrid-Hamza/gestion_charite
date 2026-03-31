export type Role = 'ADMIN' | 'ORGANIZER' | 'DONOR' | 'SUPER_ADMIN'
export type PaymentMethod = 'STRIPE' | 'PAYPAL'
export type Locale = 'fr' | 'ar'
export type OrganizationStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'
export type ActionStatus = 'OPEN' | 'CLOSED' | 'COMPLETED' | 'ACTIVE' | 'ARCHIVED'
export type DonationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED'

export interface User {
  id: number
  fullName: string
  email: string
  role: Role
  preferredLanguage: string
  phone?: string
  address?: string
  interests?: string
  createdAt?: string
}

export interface Organization {
  id: number
  name: string
  legalAddress: string
  taxIdentificationNumber: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone?: string
  logoUrl?: string
  description?: string
  mission?: string
  adminUserId: number
  status: OrganizationStatus
  createdAt?: string
}

export interface CharityAction {
  id: number
  title: string
  description: string
  targetAmount: number
  collectedAmount: number
  status: ActionStatus
  organizationId: number
  organizationName?: string
  categoryName?: string
  category?: string
  startDate?: string
  endDate?: string
  location?: string
  mediaUrls?: string | string[]
  createdAt?: string
}

export interface Donation {
  id: number
  donorName?: string
  donorEmail?: string
  amount: number
  message?: string
  actionId?: number
  charityActionId?: number
  donorUserId: number
  paymentMethod: PaymentMethod
  transactionId: string
  status: DonationStatus | string
  createdAt?: string
}

export interface Participation {
  id: number
  participantName?: string
  participantUserId: number
  actionId?: number
  charityActionId?: number
  roleInAction: string
  joinedAt?: string
  createdAt?: string
}
