export type UserRole = 'creator' | 'brand'
export type VerificationStatus = 'unverified' | 'pending' | 'verified'
export type MediaType = 'image' | 'video' | 'animation'
export type ContentType = 'video' | 'image' | 'animation' | 'other'
export type AspectRatio = '16:9' | '9:16' | '1:1' | 'other'
export type CommercialUseType = 'internal-only' | 'limited-commercial' | 'full-commercial' | 'resale'
export type BriefStatus = 'open' | 'in-progress' | 'delivered' | 'closed'
export type EngagementStatus = 'applied' | 'shortlisted' | 'in-progress' | 'delivered' | 'completed' | 'rejected'
export type InitiatedBy = 'creator' | 'brand'

export interface User {
  id: string
  email: string
  role: UserRole
  name: string | null
  avatar_url: string | null
  onboarding_complete: boolean
  created_at: string
}

export interface CreatorProfile {
  id: string
  user_id: string
  headline: string | null
  bio: string | null
  specializations: string[]
  skills: string[]
  tools_used: string[]
  portfolio_links: PortfolioLink[]
  verification_status: VerificationStatus
  rating: number
  completed_projects_count: number
  updated_at: string
  // joined from users table
  user?: User
}

export type CreatorProfileWithUser = CreatorProfile

export interface PortfolioLink {
  label: string
  url: string
}

export interface PortfolioItem {
  id: string
  creator_id: string
  title: string
  description: string | null
  media_url: string | null
  media_type: MediaType
  thumbnail_url: string | null
  tools_used: string[]
  workflow_notes: string | null
  is_featured: boolean
  is_verified: boolean
  view_count: number
  created_at: string
}

export interface Brief {
  id: string
  brand_id: string
  title: string
  campaign_description: string | null
  content_type: ContentType
  style_tags: string[]
  aspect_ratio: AspectRatio
  commercial_use_type: CommercialUseType
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  ai_generated: boolean
  status: BriefStatus
  created_at: string
  updated_at: string
  // joined
  brand?: User
}

export interface RevisionNote {
  note: string
  author: string
  created_at: string
}

export interface Engagement {
  id: string
  brief_id: string
  creator_id: string
  initiated_by: InitiatedBy
  status: EngagementStatus
  proposal_notes: string | null
  revision_notes: RevisionNote[]
  final_deliverable_url: string | null
  created_at: string
  updated_at: string
  // joined
  brief?: Brief
  creator?: CreatorProfile
}

// Extended types for pages
export interface CreatorWithProfile extends User {
  creator_profiles: CreatorProfile | null
}

export interface CreatorProfileWithPortfolio extends CreatorProfile {
  portfolio_items: PortfolioItem[]
  user: User
}

export type CreatorResult = CreatorProfileWithPortfolio
