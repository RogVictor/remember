import type { Metadata } from 'next'
import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = async ({
  params,
  searchParams,
}: Args): Promise<Metadata> =>
  ({ ...await generatePageMetadata({ config, params, searchParams }), robots: { index: false, follow: false } })

export default function AdminPage({ params, searchParams }: Args) {
  return RootPage({ config, params, searchParams, importMap })
}
