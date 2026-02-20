import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import { BrowserProvider } from 'ethers'
import type { ZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import type { EIP1193Provider } from '$/lib/eip6963'
import { ogTestnet } from '$/constants/networks'
import { rpcEndpointsByChainId } from '$/constants/rpc'

const testnetChainIdHex = '0x' + ogTestnet.chainId.toString(16)

async function ensureTestnetChain(provider: EIP1193Provider): Promise<boolean> {
	const rpcUrl = rpcEndpointsByChainId.get(ogTestnet.chainId)?.[0]?.url
	try {
		await provider.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: testnetChainIdHex }],
		})
		return true
	} catch (err: unknown) {
		const code = (err as { code?: number })?.code
		if (code === 4902 && rpcUrl) {
			try {
				await provider.request({
					method: 'wallet_addEthereumChain',
					params: [
						{
							chainId: testnetChainIdHex,
							chainName: ogTestnet.name,
							rpcUrls: [rpcUrl],
							nativeCurrency: ogTestnet.nativeCurrency,
						},
					],
				})
				await provider.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: testnetChainIdHex }],
				})
				return true
			} catch {
				return false
			}
		}
		return false
	}
}

export async function createBrokerFromProvider(
	provider: EIP1193Provider,
): Promise<ZGComputeNetworkBroker | null> {
	const ethersProvider = new BrowserProvider(provider)
	const chainId = (await ethersProvider.getNetwork()).chainId
	if (chainId !== BigInt(ogTestnet.chainId)) {
		const ok = await ensureTestnetChain(provider)
		if (!ok) return null
	}
	const signer = await ethersProvider.getSigner()
	return createZGComputeNetworkBroker(signer)
}

export function getTestnetRpcUrl(): string | undefined {
	return rpcEndpointsByChainId.get(ogTestnet.chainId)?.[0]?.url
}
