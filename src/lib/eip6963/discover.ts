import { writable } from 'svelte/store'
import type { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from './types'

const providers: EIP6963ProviderDetail[] = []
const listeners = new Set<(list: EIP6963ProviderDetail[]) => void>()

export const providersStore = writable<EIP6963ProviderDetail[]>([])

function notify() {
	const list = [...providers]
	providersStore.set(list)
	listeners.forEach((fn) => fn(list))
}

function handleAnnounce(e: Event) {
	const { detail } = e as EIP6963AnnounceProviderEvent
	if (!providers.some((p) => p.info.uuid === detail.info.uuid)) {
		providers.push(detail)
		notify()
	}
}

export function getProviders(): EIP6963ProviderDetail[] {
	return [...providers]
}

export function subscribeToProviders(callback: (list: EIP6963ProviderDetail[]) => void): () => void {
	listeners.add(callback)
	callback(getProviders())
	return () => listeners.delete(callback)
}

let inited = false
export function initEIP6963(): void {
	if (typeof window === 'undefined') return
	if (inited) return
	inited = true
	window.addEventListener('eip6963:announceProvider', handleAnnounce)
	window.dispatchEvent(new Event('eip6963:requestProvider'))
}
