import { error } from '@sveltejs/kit'
import {
	StorageNetwork,
	getStorageNetworkConfig,
} from '$/constants/storage-networks'

const VALID_NETWORKS: string[] = [StorageNetwork.Standard, StorageNetwork.Turbo]

export async function GET({ url }) {
	const root = url.searchParams.get('root')?.trim()
	const networkParam = url.searchParams.get('network') ?? StorageNetwork.Turbo
	if (!root) {
		throw error(400, 'Missing root')
	}
	if (!VALID_NETWORKS.includes(networkParam)) {
		throw error(400, 'Invalid network')
	}
	const network = networkParam as StorageNetwork
	const config = getStorageNetworkConfig(network)
	const indexerUrl = `${config.storageRpc.replace(/\/$/, '')}/file?root=${encodeURIComponent(root)}`
	const res = await fetch(indexerUrl)
	const contentType = res.headers.get('content-type')
	const isJson = contentType != null && contentType.includes('application/json')
	if (isJson) {
		const json = (await res.json()) as { code?: number; message?: string }
		if (!res.ok || json.code != null) {
			if (json.code === 101) {
				throw error(404, 'File not found for this root hash or network')
			}
			throw error(res.ok ? 502 : res.status, json.message ?? 'Download failed')
		}
	}
	if (!res.ok) {
		const text = await res.text()
		throw error(res.status, text || 'Download failed')
	}
	const body = await res.arrayBuffer()
	if (!body || body.byteLength === 0) {
		throw error(502, 'Empty file')
	}
	return new Response(body, {
		headers: {
			...(contentType ? { 'content-type': contentType } : {}),
		},
	})
}
