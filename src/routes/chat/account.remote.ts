import { command, query } from '$app/server'
import { getBroker, serializeBigInts } from '$/lib/server/broker'
import { modelByAddress } from '$/constants/models'
import { ethers } from 'ethers'

export const getAccountInfo = query(async () => {
	const broker = await getBroker()
	const ledger = await broker.ledger.getLedger()
	return serializeBigInts(ledger)
})

export const getAccountDetail = query(async () => {
	const broker = await getBroker()
	const [ledger, detail] = await Promise.all([
		broker.ledger.getLedger(),
		broker.ledger.getLedgerWithDetail(),
	])
	return serializeBigInts({ ledger, detail })
})

export const addLedger = command(
	'unchecked',
	async (arg: { amount: number }) => {
		const amount = Number(arg?.amount)
		if (!Number.isFinite(amount) || amount < 3)
			throw new Error('amount must be at least 3 OG (contract requirement)')
		const broker = await getBroker()
		await broker.ledger.addLedger(amount)
		return { success: true, message: `Ledger created with ${amount} OG` }
	},
)

export const acknowledgeProvider = command(
	'unchecked',
	async (arg: { providerAddress: string }) => {
		const providerAddress = arg?.providerAddress
		if (!providerAddress || typeof providerAddress !== 'string')
			throw new Error('providerAddress required')
		if (!modelByAddress[providerAddress])
			throw new Error('Unknown providerAddress')
		const broker = await getBroker()
		await broker.inference.acknowledgeProviderSigner(providerAddress)
		return { success: true, message: `Provider ${providerAddress} acknowledged` }
	},
)

export const transferToProvider = command(
	'unchecked',
	async (arg: { providerAddress: string; amount: number }) => {
		const providerAddress = arg?.providerAddress
		const amount = Number(arg?.amount)
		if (!providerAddress || typeof providerAddress !== 'string')
			throw new Error('providerAddress required')
		if (!Number.isFinite(amount) || amount < 1)
			throw new Error('amount must be at least 1 OG per provider')
		if (!modelByAddress[providerAddress])
			throw new Error('Unknown providerAddress')
		const broker = await getBroker()
		const wei = ethers.parseEther(amount.toString())
		await broker.ledger.transferFund(providerAddress, 'inference', wei)
		return { success: true, message: `Transferred ${amount} OG to ${providerAddress}` }
	},
)

export const withdrawFromInference = command(
	'unchecked',
	async () => {
		const broker = await getBroker()
		await broker.ledger.retrieveFund('inference')
		return { success: true, message: 'Withdrew inference balances to ledger' }
	},
)
