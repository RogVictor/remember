import config from '@payload-config'
import { getPayload } from 'payload'

export async function chatPool() {
  return (await getPayload({ config })).db.pool
}
