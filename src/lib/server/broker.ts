import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import { ethers } from 'ethers'
import type { ZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import { env } from '$env/dynamic/private'
import { ogTestnet } from '$/constants/networks'
import { rpcEndpointsByChainId } from '$/constants/rpc'

let brokerInstance: Promise<ZGComputeNetworkBroker> | null = null

export async function getBroker(): Promise<ZGComputeNetworkBroker> {
	if (!brokerInstance) {
		const walletPrivateKey = env.OG_COMPUTE_WALLET_PRIVATE_KEY
		if (!walletPrivateKey) throw new Error('OG_COMPUTE_WALLET_PRIVATE_KEY is required')
		const endpoints = rpcEndpointsByChainId.get(ogTestnet.chainId)
		const rpcUrl = endpoints?.[0]?.url
		if (!rpcUrl) throw new Error(`No RPC endpoint for chain ${ogTestnet.chainId}`)
		const rpcProvider = new ethers.JsonRpcProvider(rpcUrl)
		const wallet = new ethers.Wallet(
			walletPrivateKey.startsWith('0x') ? walletPrivateKey : `0x${walletPrivateKey}`,
			rpcProvider,
		)
		brokerInstance = createZGComputeNetworkBroker(wallet)
	}
	return brokerInstance
}

export function serializeBigInts<T>(data: T): T {
	if (data === null || data === undefined) return data
	if (typeof data === 'bigint') return String(data) as T
	if (Array.isArray(data)) return data.map(serializeBigInts) as T
	if (typeof data === 'object') {
		const out: Record<string, unknown> = {}
		for (const k of Object.keys(data as object))
			out[k] = serializeBigInts((data as Record<string, unknown>)[k])
		return out as T
	}
	return data
}
