
import type { ReactNode } from 'react'
import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './importMap.js'

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'

  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

export default function PayloadAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return RootLayout({
    children,
    config,
    importMap,
    serverFunction,
  })
}
