import { createPublicClient, defineChain, http } from 'viem'
import type { Chain, Hash, PublicClient } from 'viem'
import type { Block, Transaction } from 'viem'
import { rpcEndpointsByChainId } from '$/constants/rpc'
import { networkByChainId } from '$/constants/networks'

function toJsonSafe(value: unknown): unknown {
	if (value === null || value === undefined) return value
	if (typeof value === 'bigint') return String(value)
	if (Array.isArray(value)) return value.map(toJsonSafe)
	if (typeof value === 'object') {
		const out: Record<string, unknown> = {}
		for (const k of Object.keys(value as object))
			out[k] = toJsonSafe((value as Record<string, unknown>)[k])
		return out
	}
	return value
}

export function serializeTxForExplain(tx: Transaction<bigint, number, boolean>): Record<string, unknown> {
	return toJsonSafe({
		hash: tx.hash,
		from: tx.from,
		to: tx.to,
		value: tx.value,
		gas: tx.gas,
		gasPrice: tx.gasPrice,
		maxFeePerGas: tx.maxFeePerGas,
		maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
		blockNumber: tx.blockNumber,
		blockHash: tx.blockHash,
		input: typeof tx.input === 'string' ? (tx.input.slice(0, 66) + (tx.input.length > 66 ? '...' : '')) : tx.input,
	}) as Record<string, unknown>
}

export function getChain(chainId: number): Chain {
	const net = networkByChainId[chainId]
	const endpoints = rpcEndpointsByChainId.get(chainId)
	const url = endpoints?.[0]?.url ?? ''
	return defineChain({
		id: chainId,
		name: net?.name ?? `Chain ${chainId}`,
		nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
		rpcUrls: { default: { http: [url] } },
	})
}

export function createExplorerClient(chainId: number): PublicClient {
	const chain = getChain(chainId)
	const endpoints = rpcEndpointsByChainId.get(chainId)
	const url = endpoints?.[0]?.url
	if (!url) throw new Error(`No RPC for chain ${chainId}`)
	return createPublicClient({
		chain,
		transport: http(url),
	})
}

export async function getBlockWithTransactions(
	client: PublicClient,
	blockNumber: bigint,
): Promise<Block<bigint, true, 'latest'>> {
	const block = await client.getBlock({
		blockNumber,
		includeTransactions: true,
	})
	const txList = block.transactions as (Hash | Transaction<bigint, number, boolean>)[]
	const first = txList[0]
	if (txList.length === 0 || typeof first !== 'string')
		return block as Block<bigint, true, 'latest'>
	const txs = await Promise.all(
		(txList as Hash[]).map((hash) =>
			client.getTransaction({ hash }),
		),
	)
	return {
		...block,
		transactions: txs.filter(Boolean) as Transaction<bigint, number, boolean>[],
	} as Block<bigint, true, 'latest'>
}
