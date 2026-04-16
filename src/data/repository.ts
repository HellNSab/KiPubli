import { loadGroups, loadPublishers } from './csvLoader'
import type { Group, OwnershipChain, Publisher } from './types'

export async function getAllPublishers(): Promise<Publisher[]> {
  return loadPublishers()
}

export async function getGroupById(id: string): Promise<Group | undefined> {
  const groups = await loadGroups()
  return groups.find((g) => g.id === id)
}

export async function getOwnershipChain(publisher: Publisher): Promise<OwnershipChain | null> {
  const group = await getGroupById(publisher.group_id)
  if (!group) return null
  return { publisher, group }
}
