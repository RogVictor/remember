import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConverterArgs, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { CategoryServicesBlock } from '../../payload-types'
import { CallbackForm } from '../../src/App'
import { ServiceCategorySection } from '../../src/ServiceCategoryGrid'
import SiteApp from '../../src/SiteApp'
import { getPublishedPage, getServiceCatalog, relationshipID } from '../../src/lib/cms'

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
    alternates: { canonical: `/${page.slug}` },
  }
}

async function CategoryServices({ categoryId }: { categoryId: number | string }) {
  const { groups, serviceLinks } = await getServiceCatalog()
  const group = groups.find(item => item.categoryId === categoryId)
  return group ? <ServiceCategorySection group={group} links={serviceLinks} /> : null
}

export default async function CMSPageRoute({ params }: PageProps) {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page) notFound()

  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    blocks: {
      'category-services': ({ node }: JSXConverterArgs<SerializedBlockNode<CategoryServicesBlock>>) => {
        const categoryId = relationshipID(node.fields.category)
        return categoryId == null ? null : <CategoryServices categoryId={categoryId} />
      },
      'callback-form': () => <CallbackForm source={`/${page.slug}`} />,
    },
  })

  return (
    <SiteApp page="cms" cmsTitle={page.title}>
      {page.content && <RichText data={page.content} converters={converters} />}
    </SiteApp>
  )
}
