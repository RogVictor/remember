import type { ComponentProps } from 'react'
import App from './App'
import ChatWidget from './ChatWidget'
import { chatConfigured } from './lib/chat-telegram'
import { getCompanySettings } from './lib/cms'

export default async function SiteApp(props: ComponentProps<typeof App>) {
  const company = await getCompanySettings()
  return <><App {...props} company={company} />{chatConfigured() && <ChatWidget />}</>
}
