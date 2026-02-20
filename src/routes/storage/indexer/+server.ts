import { error } from '@sveltejs/kit'
import {
	StorageNetwork,
	getStorageNetworkConfig,
} from '$/constants/storage-networks'

const VALID_NETWORKS: string[] = [StorageNetwork.Standard, StorageNetwork.Turbo]

export async function POST({ url, request }) {
	const networkParam = url.searchParams.get('network') ?? StorageNetwork.Turbo
	if (!VALID_NETWORKS.includes(networkParam)) {
		throw error(400, 'Invalid network')
	}
	const config = getStorageNetworkConfig(networkParam as StorageNetwork)
	const indexerUrl = config.storageRpc.replace(/\/$/, '')
	let body: string
	try {
		body = await request.text()
	} catch {
		throw error(400, 'Invalid body')
	}
	const res = await fetch(indexerUrl, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body,
	})
	const resContentType = res.headers.get('content-type') ?? 'application/json'
	const resBody = await res.text()
	return new Response(resBody, {
		status: res.status,
		headers: { 'content-type': resContentType },
	})
}
