import type { ComponentProps } from 'react'
import App from './App'
import ChatWidget from './ChatWidget'
import { chatConfigured } from './lib/chat-telegram'
import { getCompanySettings, getServices } from './lib/cms'

export default async function SiteApp(props: ComponentProps<typeof App>) {
  const [company, services] = await Promise.all([
    getCompanySettings(),
    props.services ?? getServices(),
  ])
  const serviceLinks = services.data.flatMap(({ id, title, linkSlug }) =>
    linkSlug ? [{ id, title, href: `/${linkSlug}` }] : [],
  )

  return <><App {...props} company={company} serviceLinks={serviceLinks} />{chatConfigured() && <ChatWidget />}</>
}
