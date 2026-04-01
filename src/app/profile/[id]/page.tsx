'use client'

import ProfileView from '../components/ProfileView'
import { use } from 'react'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

// Dynamic profile page - shows specific user profile
export default function ProfileIdPage({ params }: ProfilePageProps) {
  const resolvedParams = use(params)
  return <ProfileView userId={resolvedParams.id} />
}