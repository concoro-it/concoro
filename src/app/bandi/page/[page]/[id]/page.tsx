"use client"

import { notFound, redirect } from "next/navigation"

interface PageProps {
  params: {
    page: string
    id: string
  }
}

export default function BandiPageWithIdPage({ params }: PageProps) {
  // Redirect to desktop view - this handles URLs like /bandi/page/2/abc123
  // The main /bandi page will handle showing the details in sidebar
  redirect(`/bandi?page=${params.page}&id=${params.id}`)
} 