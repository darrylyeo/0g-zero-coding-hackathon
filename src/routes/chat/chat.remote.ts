import { query } from '$app/server'
import { getBroker, serializeBigInts } from '$/lib/server/broker'
import { modelByAddress } from '$/constants/models'

type ServiceRow = { provider: string; [k: string]: unknown }

const modelForProvider = (provider: string) =>
	modelByAddress[provider] ??
	Object.values(modelByAddress).find(
		(m) => m.contract.address.toLowerCase() === provider?.toLowerCase(),
	)

export const listTestnetServices = query(async () => {
	const broker = await getBroker()
	const rawServices = (await broker.inference.listService()) as unknown as ServiceRow[]
	const services = rawServices
		.filter((s) => modelForProvider(s.provider ?? ''))
		.map((s) => ({
			...serializeBigInts(s),
			label: modelForProvider(s.provider ?? '')?.name,
		}))
	return { success: true, services }
})
