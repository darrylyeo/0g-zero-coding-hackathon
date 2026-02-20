import { agentById } from '$/constants/agents'
import { modelByAddress } from '$/constants/models'
import { getBroker } from '$/lib/server/broker'
import { streamText, convertToCoreMessages, type UIMessage } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { RequestHandler } from './$types'

const FINISH_PREFIX = '9:0g_finish:'

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json()
		const messages = body.messages as UIMessage[] | undefined
		const selectedProviderAddress = body.providerAddress as string | undefined
		const contextAgentIds = (body.contextAgentIds as string[] | undefined) ?? []
		let endpoint = body.endpoint as string | undefined
		let model = body.model as string | undefined
		let authHeaders = body.authHeaders as Record<string, string> | undefined
		if (!messages?.length || !selectedProviderAddress) {
			return new Response(
				JSON.stringify({ error: 'messages and providerAddress required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } },
			)
		}
		if (!endpoint || !model || !authHeaders || typeof authHeaders !== 'object') {
			const lastUserContent =
				typeof messages[messages.length - 1]?.content === 'string'
					? messages[messages.length - 1].content
					: ''
			try {
				const broker = await getBroker()
				const meta = await broker.inference.getServiceMetadata(selectedProviderAddress)
				endpoint = meta.endpoint
				model = meta.model
				const raw = await broker.inference.getRequestHeaders(
					selectedProviderAddress,
					lastUserContent,
				)
				authHeaders = {}
				for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') authHeaders[k] = v
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err)
				return new Response(
					JSON.stringify({
						error: `Server broker failed (endpoint/model/headers): ${message}`,
					}),
					{ status: 502, headers: { 'Content-Type': 'application/json' } },
				)
			}
		}
		if (!modelByAddress[selectedProviderAddress]) {
			return new Response(
				JSON.stringify({ error: 'Unknown providerAddress' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } },
			)
		}
		let coreMessages = convertToCoreMessages(messages)
		if (contextAgentIds.length > 0) {
			const contextParts = contextAgentIds
				.map((id) => agentById[id])
				.filter(Boolean)
				.map(
					(a) =>
						`- ${a.name}: ${a.description}`,
				)
			if (contextParts.length > 0)
				coreMessages = [
					{
						role: 'system',
						content: `Use the following agents as context when answering:\n\n${contextParts.join('\n')}`,
					},
					...coreMessages,
				]
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
			messages: coreMessages,
			onFinish: async ({ text, response }) => {
				finishResolve!({ chatId: response?.id ?? '', text: text ?? '' })
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
