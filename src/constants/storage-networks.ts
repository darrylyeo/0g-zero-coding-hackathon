export enum StorageNetwork {
	Standard = 'standard',
	Turbo = 'turbo',
}

export type StorageNetworkConfig = {
	name: string
	flowAddress: string
	storageRpc: string
	explorerUrl: string
	l1Rpc: string
}

const defaultStandard: StorageNetworkConfig = {
	name: 'Standard',
	flowAddress: '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296',
	storageRpc: 'https://indexer-storage-testnet-standard.0g.ai',
	explorerUrl: 'https://chainscan-galileo.0g.ai/tx/',
	l1Rpc: 'https://evmrpc-testnet.0g.ai',
}

const defaultTurbo: StorageNetworkConfig = {
	name: 'Turbo',
	flowAddress: '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296',
	storageRpc: 'https://indexer-storage-testnet-turbo.0g.ai',
	explorerUrl: 'https://chainscan-galileo.0g.ai/tx/',
	l1Rpc: 'https://evmrpc-testnet.0g.ai',
}

export const STORAGE_NETWORKS = [
	{ type: StorageNetwork.Standard, ...defaultStandard },
	{ type: StorageNetwork.Turbo, ...defaultTurbo },
] as const

export const storageNetworkByType = Object.fromEntries(
	STORAGE_NETWORKS.map((n) => [n.type, n]),
) as Record<StorageNetwork, (typeof STORAGE_NETWORKS)[number]>

export function getStorageNetworkConfig(
	type: StorageNetwork,
	overrides?: Partial<StorageNetworkConfig>,
): StorageNetworkConfig {
	const base = storageNetworkByType[type]
	return overrides ? { ...base, ...overrides } : { ...base }
}

export function getExplorerTxUrl(txHash: string, type: StorageNetwork): string {
	return getStorageNetworkConfig(type).explorerUrl + txHash
}
