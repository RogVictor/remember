import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import SiteApp from '../../src/SiteApp'
import { getPublishedPage } from '../../src/lib/cms'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page) return {}

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  }
}

export default async function CMSPageRoute({ params }: PageProps) {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page) notFound()

  return (
    <SiteApp page="cms" cmsTitle={page.title}>
      {page.content && <RichText data={page.content} />}
    </SiteApp>
  )
}
