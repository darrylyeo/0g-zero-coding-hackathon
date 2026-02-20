import { getBroker } from '$/lib/server/broker'
import { modelByAddress, models } from '$/constants/models'
import { streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { RequestHandler } from './$types'

const FINISH_PREFIX = '9:0g_finish:'

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json()
		const txPayload = body.tx as Record<string, unknown> | undefined
		const providerAddress = (body.providerAddress as string | undefined) ?? models[0].contract.address
		const clientEndpoint = body.endpoint as string | undefined
		const clientModel = body.model as string | undefined
		const clientAuthHeaders = body.authHeaders as Record<string, string> | undefined
		if (!txPayload || !providerAddress || !modelByAddress[providerAddress]) {
			return new Response(
				JSON.stringify({ error: 'tx and valid providerAddress required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } },
			)
		}
		const prompt = `Explain this blockchain transaction in 2-4 short sentences for a general audience. Focus on what the transaction does (e.g. token transfer, contract call), who is involved, and the main outcome.\n\nTransaction data:\n${JSON.stringify(txPayload, null, 2)}`
		let endpoint: string
		let model: string
		let authHeaders: Record<string, string>
		if (clientEndpoint && clientModel && clientAuthHeaders && typeof clientAuthHeaders === 'object') {
			endpoint = clientEndpoint
			model = clientModel
			authHeaders = clientAuthHeaders
		} else {
			const broker = await getBroker()
			const meta = await broker.inference.getServiceMetadata(providerAddress)
			endpoint = meta.endpoint
			model = meta.model
			const raw = await broker.inference.getRequestHeaders(providerAddress, prompt)
			authHeaders = {}
			for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') authHeaders[k] = v
		}
		const openAiCompat = createOpenAICompatible({
			baseURL: endpoint,
			apiKey: '',
			headers: authHeaders,
		})
		let finishResolve: (p: { chatId: string; text: string }) => void
		const finishPromise = new Promise<{ chatId: string; text: string }>((r) => {
			finishResolve = r
		})
		const streamResult = streamText({
			model: openAiCompat(model),
			messages: [{ role: 'user', content: prompt }],
			onFinish: async ({ text, response }) => {
				finishResolve!({ chatId: response?.id ?? '', text: text ?? '' })
				if (!clientEndpoint || !clientModel) {
					try {
						const broker = await getBroker()
						await broker.inference.processResponse(
							providerAddress,
							response?.id ?? '',
							text ?? '',
						)
					} catch {
						// best-effort
					}
				}
			},
		})
		const res = streamResult.toDataStreamResponse()
		if (!res.body) return res
		const encoder = new TextEncoder()
		const transformed = res.body.pipeThrough(
			new TransformStream({
				async flush(controller) {
					const payload = await Promise.race([
						finishPromise,
						new Promise<{ chatId: string; text: string }>((_, rej) =>
							setTimeout(() => rej(new Error('timeout')), 5000),
						),
					]).catch(() => ({ chatId: '', text: '' }))
					controller.enqueue(
						encoder.encode(FINISH_PREFIX + JSON.stringify(payload) + '\n'),
					)
				},
			}),
		)
		return new Response(transformed, { status: res.status, headers: res.headers })
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		return new Response(
			JSON.stringify({ error: message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		)
	}
}
