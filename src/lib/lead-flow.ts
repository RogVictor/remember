export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed'
export type NotificationStatus = 'pending' | 'sent' | 'partial' | 'failed'

export type ExistingStatuses = {
  telegramStatus?: NotificationDeliveryStatus | null
  emailStatus?: NotificationDeliveryStatus | null
}

export type LeadNotificationStatuses = {
  telegramStatus: NotificationDeliveryStatus
  emailStatus: NotificationDeliveryStatus
  notificationStatus: NotificationStatus
}

export const deliverLeadNotifications = async (
  lead: ExistingStatuses,
  sendTelegram: () => Promise<void>,
  sendEmail: () => Promise<void>,
): Promise<LeadNotificationStatuses> => {
  const [telegram, email] = await Promise.allSettled([
    lead.telegramStatus === 'sent' ? Promise.resolve() : sendTelegram(),
    lead.emailStatus === 'sent' ? Promise.resolve() : sendEmail(),
  ])

  const telegramStatus: NotificationDeliveryStatus =
    telegram.status === 'fulfilled' ? 'sent' : 'failed'
  const emailStatus: NotificationDeliveryStatus =
    email.status === 'fulfilled' ? 'sent' : 'failed'
  const sentCount = Number(telegramStatus === 'sent') + Number(emailStatus === 'sent')

  return {
    telegramStatus,
    emailStatus,
    notificationStatus: sentCount === 2 ? 'sent' : sentCount === 1 ? 'partial' : 'failed',
  }
}

export const createLeadAndNotify = async <T extends ExistingStatuses & { id: number | string }>(
  createLead: () => Promise<T>,
  sendTelegram: (lead: T) => Promise<void>,
  sendEmail: (lead: T) => Promise<void>,
  saveStatuses: (id: T['id'], statuses: LeadNotificationStatuses) => Promise<void>,
  reportStatusSaveFailure: (id: T['id']) => void,
): Promise<T> => {
  const lead = await createLead()
  const statuses = await deliverLeadNotifications(
    lead,
    () => sendTelegram(lead),
    () => sendEmail(lead),
  )

  try {
    await saveStatuses(lead.id, statuses)
  } catch {
    reportStatusSaveFailure(lead.id)
  }

  return lead
}
