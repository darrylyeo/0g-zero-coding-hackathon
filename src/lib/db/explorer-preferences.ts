import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/db'

export type ExplorerPreferences = {
	id: string
	chainId?: number
}

const STORAGE_KEY = '0g-explorer-preferences'

export const explorerPreferencesCollection = createCollection(
	localStorageCollectionOptions<ExplorerPreferences>({
		id: 'explorer-preferences',
		storageKey: STORAGE_KEY,
		getKey: (item) => item.id,
	}),
)

export const DEFAULT_EXPLORER_PREFS_ID = 'default' as const

export function upsertExplorerPreferences(
	partial: Partial<Omit<ExplorerPreferences, 'id'>>,
) {
	if (explorerPreferencesCollection.has(DEFAULT_EXPLORER_PREFS_ID))
		explorerPreferencesCollection.update(DEFAULT_EXPLORER_PREFS_ID, (draft) =>
			Object.assign(draft, partial),
		)
	else
		explorerPreferencesCollection.insert({
			id: DEFAULT_EXPLORER_PREFS_ID,
			...partial,
		})
}
