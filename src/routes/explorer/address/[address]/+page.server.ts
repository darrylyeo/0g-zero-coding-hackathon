import { networks } from '$/constants/networks'
import { createExplorerClient } from '$/lib/explorer-client'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url }) => {
	const address = params.address as `0x${string}`
	const chainId = Number(url.searchParams.get('chainId')) || networks[0].chainId
	if (!address || !address.startsWith('0x')) return { address, balance: null, nonce: null, error: 'Invalid address', chainId }
	try {
		const client = createExplorerClient(chainId)
		const [balance, nonce] = await Promise.all([
			client.getBalance({ address }),
			client.getTransactionCount({ address }),
		])
		return { address, balance, nonce, chainId }
	} catch (e) {
		const error = e instanceof Error ? e.message : String(e)
		return { address, balance: null, nonce: null, error, chainId }
	}
}
