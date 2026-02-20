import { networks } from '$/constants/networks'
import { createExplorerClient, getBlockWithTransactions } from '$/lib/explorer-client'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url }) => {
	const blockNumParam = params.blockNum
	const chainId = Number(url.searchParams.get('chainId')) || networks[0].chainId
	let blockNum: bigint
	try {
		blockNum = BigInt(blockNumParam)
	} catch {
		return { block: null, blockNum: blockNumParam, error: 'Invalid block number', chainId }
	}
	if (blockNum < 0n) return { block: null, blockNum: blockNumParam, error: 'Invalid block number', chainId }
	try {
		const client = createExplorerClient(chainId)
		const block = await getBlockWithTransactions(client, blockNum)
		return { block, blockNum: blockNumParam, chainId }
	} catch (e) {
		const error = e instanceof Error ? e.message : String(e)
		return { block: null, blockNum: blockNumParam, error, chainId }
	}
}
