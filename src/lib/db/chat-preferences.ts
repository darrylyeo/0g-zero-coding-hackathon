import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/db'

export type ChatPreferences = {
	id: string
	providerAddress?: string
	contextAgentIds?: string[]
}

const CHAT_PREFS_STORAGE_KEY = '0g-chat-preferences'

export const chatPreferencesCollection = createCollection(
	localStorageCollectionOptions<ChatPreferences>({
		id: 'chat-preferences',
		storageKey: CHAT_PREFS_STORAGE_KEY,
		getKey: (item) => item.id,
	}),
)

export const DEFAULT_PREFS_ID = 'default' as const

export function upsertChatPreferences(
	partial: Partial<Omit<ChatPreferences, 'id'>>,
) {
	if (chatPreferencesCollection.has(DEFAULT_PREFS_ID))
		chatPreferencesCollection.update(DEFAULT_PREFS_ID, (draft) =>
			Object.assign(draft, partial),
		)
	else
		chatPreferencesCollection.insert({
			id: DEFAULT_PREFS_ID,
			...partial,
		})
}
