import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/db'

export type ChatQueueState = {
	id: string
	items: string[]
}

const STORAGE_KEY = '0g-chat-queue'
const QUEUE_ID = 'default' as const

export const chatQueueCollection = createCollection(
	localStorageCollectionOptions<ChatQueueState>({
		id: 'chat-queue',
		storageKey: STORAGE_KEY,
		getKey: (item) => item.id,
	}),
)

export function upsertChatQueue(update: { items?: string[] }) {
	if (chatQueueCollection.has(QUEUE_ID))
		chatQueueCollection.update(QUEUE_ID, (draft) =>
			Object.assign(draft, update),
		)
	else
		chatQueueCollection.insert({
			id: QUEUE_ID,
			items: update.items ?? [],
		})
}

export function pushChatQueueItem(text: string) {
	const current = chatQueueCollection.get(QUEUE_ID)?.items ?? []
	upsertChatQueue({ items: [...current, text] })
}

export function shiftChatQueue() {
	const current = chatQueueCollection.get(QUEUE_ID)?.items ?? []
	if (current.length === 0) return
	upsertChatQueue({ items: current.slice(1) })
}

export function getChatQueueItems(): string[] {
	return chatQueueCollection.get(QUEUE_ID)?.items ?? []
}
