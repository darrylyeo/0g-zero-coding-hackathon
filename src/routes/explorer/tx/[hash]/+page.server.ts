import { networks } from '$/constants/networks'
import { createExplorerClient } from '$/lib/explorer-client'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url }) => {
	const hash = params.hash as `0x${string}`
	const chainId = Number(url.searchParams.get('chainId')) || networks[0].chainId
	if (!hash || !hash.startsWith('0x')) return { tx: null, error: 'Invalid hash', chainId }
	try {
		const client = createExplorerClient(chainId)
		const tx = await client.getTransaction({ hash })
		return { tx, hash, chainId }
	} catch (e) {
		const error = e instanceof Error ? e.message : String(e)
		return { tx: null, hash, error, chainId }
	}
}
