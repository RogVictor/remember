import type { Metadata } from 'next'
import Link from 'next/link'
import { mediaURL } from '@/lib/media-url'
import { notFound } from 'next/navigation'
import type { SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConverterArgs, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import ServiceArticle from '@/ServiceArticle'
import type { CategoryServicesBlock, Media } from '../../../payload-types'
import { CallbackForm } from '@/CallbackForm'
import { ServiceCategoryHeadings, ServiceCategorySection } from '@/ServiceCategoryGrid'
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
  return group ? <ServiceCategoryHeadings group={group} links={serviceLinks} /> : null
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
      return href ? <Link href={href} prefetch={false} target={node.fields.newTab ? '_blank' : undefined}
        rel={node.fields.newTab ? 'noopener noreferrer' : undefined}>{children}</Link> : <>{children}</>
    },
    upload: (args) => {
      const asset = args.node.value
      if (!asset || typeof asset !== 'object' || typeof asset.mimeType !== 'string') return null
      if (args.node.relationTo !== 'media' || !asset.mimeType.startsWith('image/')) {
        return typeof defaultConverters.upload === 'function' ? defaultConverters.upload(args) : null
      }
      const media = asset as unknown as Media
      if (!media.url) return null
      const alt = media.decorative ? '' : String(args.node.fields?.alt || media.alt || '')
      const img = <img loading="lazy" src={mediaURL(media.url, media.updatedAt)} alt={alt}
        width={media.width ?? undefined} height={media.height ?? undefined} />
      if (!media.sizes) return img
      return <picture>{Object.entries(media.sizes).map(([name, size]) =>
        size?.url && size.width && size.mimeType
          ? <source key={name} media={`(max-width: ${size.width}px)`} type={size.mimeType}
              srcSet={mediaURL(size.url, media.updatedAt)} />
          : null)}{img}</picture>
    },
    blocks: {
      'category-services': ({ node }: JSXConverterArgs<SerializedBlockNode<CategoryServicesBlock>>) => {
        const categoryId = relationshipID(node.fields.category)
        return categoryId == null ? null : <CategoryServices categoryId={categoryId} />
      },
      'callback-form': () => <CallbackForm source={`/${page.slug}`} />,
    },
  })

  const relatedSection = related && related.services.length > 0
    ? <ServiceCategorySection group={related} links={serviceLinks} /> : null
  return (
    <SiteApp page="cms" landingKind={seo.landingKind} cmsTitle={page.title} breadcrumbs={breadcrumbs}>
      <JsonLd origin={input.origin} path={input.path} title={page.title} description={resolveSeo(input).description}
        company={company} breadcrumbs={breadcrumbs} services={services} type={type} dateModified={page.updatedAt} />
      {page.content && (seo.landingKind
        ? <ServiceArticle content={page.content} converters={converters} related={relatedSection} />
        : <RichText data={page.content} converters={converters} />)}
      {extraCategory && <ServiceCategoryHeadings group={extraCategory} links={serviceLinks} />}
      {!page.content && relatedSection}
    </SiteApp>
  )
}
