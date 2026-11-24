import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConverterArgs, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { CategoryServicesBlock } from '../../../payload-types'
import { CallbackForm } from '@/App'
import { ServiceCategorySection } from '@/ServiceCategoryGrid'
import SiteApp from '@/SiteApp'
import { getServiceCatalog, relationshipID } from '@/lib/cms'
import { JsonLd } from '@/seo/JsonLd'
import { record } from '@/seo/content'
import { metadata, resolveSeo } from '@/seo/metadata'
import { landingSeo } from '@/seo/public'
import { landingPath } from '@/seo/routes'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const seo = await landingSeo(slug)
  return seo ? metadata(seo.input, seo.type === 'Article') : { robots: { index: false, follow: false } }
}

async function CategoryServices({ categoryId }: { categoryId: number | string }) {
  const { groups, serviceLinks } = await getServiceCatalog()
  const group = groups.find(item => item.categoryId === categoryId)
  return group ? <ServiceCategorySection group={group} links={serviceLinks} /> : null
}

export default async function CMSPageRoute({ params }: PageProps) {
  const { slug } = await params
  const seo = await landingSeo(slug)
  if (!seo) notFound()
  const { input, page, company, breadcrumbs, services, type, extraCategory, related, serviceLinks } = seo

  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    link: (args) => {
      const { node, nodesToJSX } = args
      if (node.fields.linkType !== 'internal') return typeof defaultConverters.link === 'function'
        ? defaultConverters.link(args)
        : nodesToJSX({ nodes: node.children })
      const target = record(node.fields.doc?.value)
      const href = target?._status === 'published' ? landingPath(target.slug) : null
      const children = nodesToJSX({ nodes: node.children })
      return href ? <a href={href} target={node.fields.newTab ? '_blank' : undefined}
        rel={node.fields.newTab ? 'noopener noreferrer' : undefined}>{children}</a> : <>{children}</>
    },
    upload: (args) => {
      const asset = args.node.value
      if (!asset || typeof asset !== 'object' || typeof asset.mimeType !== 'string') return null
      const node = asset.decorative === true
        ? { ...args.node, value: { ...asset, alt: '' }, fields: { ...args.node.fields, alt: '' } }
        : args.node
      return typeof defaultConverters.upload === 'function' ? defaultConverters.upload({ ...args, node }) : null
    },
    blocks: {
      'category-services': ({ node }: JSXConverterArgs<SerializedBlockNode<CategoryServicesBlock>>) => {
        const categoryId = relationshipID(node.fields.category)
        return categoryId == null ? null : <CategoryServices categoryId={categoryId} />
      },
      'callback-form': () => <CallbackForm source={`/${page.slug}`} />,
    },
  })

  return (
    <SiteApp page="cms" cmsTitle={page.title} breadcrumbs={breadcrumbs}>
      <JsonLd origin={input.origin} path={input.path} title={page.title} description={resolveSeo(input).description}
        company={company} breadcrumbs={breadcrumbs} services={services} type={type} dateModified={page.updatedAt} />
      {page.content && <RichText data={page.content} converters={converters} />}
      {extraCategory && <ServiceCategorySection group={extraCategory} links={serviceLinks} />}
      {related && related.services.length > 0 && <ServiceCategorySection group={related} links={serviceLinks} />}
    </SiteApp>
  )
}
