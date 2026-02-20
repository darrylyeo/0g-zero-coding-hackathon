export interface EIP6963ProviderInfo {
	uuid: string
	name: string
	icon: string
	rdns: string
}

export interface EIP1193Provider {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export interface EIP6963ProviderDetail {
	info: EIP6963ProviderInfo
	provider: EIP1193Provider
}

export type EIP6963AnnounceProviderEvent = CustomEvent<EIP6963ProviderDetail>

declare global {
	interface WindowEventMap {
		'eip6963:announceProvider': EIP6963AnnounceProviderEvent
	}
}
