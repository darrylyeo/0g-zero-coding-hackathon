import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/db'

export type TxExplanation = {
	id: string
	chainId: number
	txHash: string
	explanation: string
}

const STORAGE_KEY = '0g-tx-explanations'

export const txExplanationsCollection = createCollection(
	localStorageCollectionOptions<TxExplanation>({
		id: 'tx-explanations',
		storageKey: STORAGE_KEY,
		getKey: (item) => item.id,
	}),
)

export function txExplanationId(chainId: number, txHash: string) {
	return `${chainId}:${txHash.toLowerCase()}`
}

export function upsertTxExplanation(
	entry: Omit<TxExplanation, 'id'>,
) {
	const id = txExplanationId(entry.chainId, entry.txHash)
	const full: TxExplanation = { ...entry, id }
	if (txExplanationsCollection.has(id))
		txExplanationsCollection.update(id, () => full)
	else
		txExplanationsCollection.insert(full)
}

export function getTxExplanation(chainId: number, txHash: string): TxExplanation | undefined {
	return txExplanationsCollection.get(txExplanationId(chainId, txHash))
}
