<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check'
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down'
	import { eq } from '@tanstack/db'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { useChat } from '@ai-sdk/svelte'
	import { agents } from '$/constants/agents'
	import { models } from '$/constants/models'
	import { ogTestnet } from '$/constants/networks'
	import { rpcEndpointsByChainId } from '$/constants/rpc'
	import {
		chatPreferencesCollection,
		upsertChatPreferences,
	} from '$/lib/db/chat-preferences'
	import {
		chatQueueCollection,
		pushChatQueueItem,
		shiftChatQueue,
	} from '$/lib/db/chat-queue'
	import { createBrokerFromProvider } from '$/lib/broker-client'
	import AccountSelect from '$/components/account-select.svelte'
	import * as Command from '$/components/ui/command'
	import * as Popover from '$/components/ui/popover'
	import { flip } from 'svelte/animate'
	import { fade } from 'svelte/transition'
	import { cn } from '$/lib/utils'

	let provider = $state<import('$lib/eip6963').EIP1193Provider | null>(null)
	let comboboxOpen = $state(false)
	let input = $state('')
	let connectedAddress = $state<string | null>(null)
	let balanceOg = $state<string | null>(null)
	let processingLock = $state(false)
	let waitingOn = $state<'connecting wallet' | 'funds' | 'response' | null>(null)
	let queueError = $state<string | null>(null)

	const queueQuery = useLiveQuery((q) =>
		q
			.from({ q: chatQueueCollection })
			.where(({ q }) => eq(q.id, 'default')),
	)
	const messageQueue = $derived(queueQuery.data[0]?.items ?? [])

	$effect(() => {
		const p = provider
		if (!p) {
			connectedAddress = null
			balanceOg = null
			return
		}
		let cancelled = false
		;(async () => {
			try {
				const accs = (await p.request({
					method: 'eth_accounts',
					params: [],
				})) as string[] | undefined
				const addr = Array.isArray(accs) && accs[0] ? String(accs[0]) : null
				if (cancelled) return
				connectedAddress = addr
				if (!addr) {
					balanceOg = null
					return
				}
				const endpoints = rpcEndpointsByChainId.get(ogTestnet.chainId)
				const rpc = endpoints?.[0]
				if (!rpc) {
					balanceOg = null
					return
				}
				const res = await fetch(rpc.url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						jsonrpc: '2.0',
						id: 1,
						method: 'eth_getBalance',
						params: [addr, 'latest'],
					}),
				})
				const data = (await res.json()) as { result?: string }
				const wei = data?.result ? BigInt(data.result) : 0n
				if (cancelled) return
				balanceOg = (Number(wei) / 1e18).toFixed(4) + ' $0G'
			} catch {
				if (!cancelled) balanceOg = null
			}
		})()
		return () => {
			cancelled = true
		}
	})

	const prefsQuery = useLiveQuery((q) =>
		q
			.from({ p: chatPreferencesCollection })
			.where(({ p }) => eq(p.id, 'default')),
	)
	const prefs = $derived(prefsQuery.data[0])
	const selectedProviderAddress = $derived(
		prefs?.providerAddress ?? models[0].contract.address,
	)
	const contextAgentIds = $derived(prefs?.contextAgentIds ?? [])

	const chat = useChat({ api: '/chat/stream' })
	const messages = chat.messages
	let chatStatus = $state<'submitted' | 'streaming' | 'ready' | 'error'>('ready')
	$effect(() => {
		const unsub = chat.status.subscribe((v) => {
			chatStatus = v
		})
		return () => unsub()
	})
	const isWaitingOnResponse = $derived(
		chatStatus === 'submitted' || chatStatus === 'streaming',
	)

	let messagesListEl = $state<HTMLUListElement | null>(null)
	$effect(() => {
		messageQueue.length
		const el = messagesListEl
		if (!el) return
		el.scrollTop = el.scrollHeight
		const unsub = messages.subscribe(() => {
			if (messagesListEl) messagesListEl.scrollTop = messagesListEl.scrollHeight
		})
		return unsub
	})

	$effect(() => {
		if (messageQueue.length === 0 && !isWaitingOnResponse) {
			waitingOn = null
			queueError = null
			return
		}
		if (messageQueue.length === 0) return
		if (isWaitingOnResponse) {
			waitingOn = 'response'
			return
		}
		if (waitingOn === 'funds') return
		if (processingLock) return
		if (!provider) {
			waitingOn = 'connecting wallet'
			return
		}
		processingLock = true
		queueError = null
		const message = messageQueue[0]
		const providerAddress = selectedProviderAddress
		const agentIds = [...contextAgentIds]
		;(async () => {
			try {
				const broker = await createBrokerFromProvider(provider!)
				if (!broker) {
					waitingOn = 'connecting wallet'
					processingLock = false
					return
				}
				const { endpoint, model } =
					await broker.inference.getServiceMetadata(providerAddress)
				const rawHeaders = await broker.inference.getRequestHeaders(
					providerAddress,
					message,
				)
				const authHeaders: Record<string, string> = {}
				for (const [k, v] of Object.entries(rawHeaders))
					if (typeof v === 'string') authHeaders[k] = v
				chat.append(
					{ role: 'user', content: message },
					{
						body: {
							providerAddress,
							contextAgentIds: agentIds,
							endpoint,
							model,
							authHeaders,
						},
					},
				)
				shiftChatQueue()
				waitingOn = 'response'
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err)
				queueError = msg
				const lower = msg.toLowerCase()
				waitingOn = (
					lower.includes('balance') ||
					lower.includes('ledger') ||
					lower.includes('transfer') ||
					lower.includes('fund') ||
					lower.includes('insufficient')
				)
					? 'funds'
					: null
			} finally {
				processingLock = false
			}
		})()
	})

	function setProviderAddress(addr: string) {
		upsertChatPreferences({ providerAddress: addr })
	}

	function toggleAgent(id: string) {
		const current = prefsQuery.data[0]?.contextAgentIds ?? []
		const next = current.includes(id)
			? current.filter((x) => x !== id)
			: [...current, id]
		upsertChatPreferences({ contextAgentIds: next })
	}

	function removeAgent(id: string) {
		const current = prefsQuery.data[0]?.contextAgentIds ?? []
		upsertChatPreferences({ contextAgentIds: current.filter((x) => x !== id) })
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		const text = input.trim()
		if (!text) return
		pushChatQueueItem(text)
		input = ''
	}
</script>

<svelte:head>
	<title>Chat · 0GUI</title>
</svelte:head>

<main class="flex h-full min-h-0 flex-col overflow-hidden">
	<header class="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-4">
		<div class="mx-auto flex max-w-3xl w-full items-center justify-between">
			<h1 class="text-lg font-semibold tracking-tight">Chat</h1>
			<div class="flex items-center gap-3">
				{#if connectedAddress ?? balanceOg != null}
					<div class="flex items-center gap-2 rounded-md border border-transparent bg-muted/50 px-2.5 py-1.5 font-mono text-xs">
						{#if connectedAddress}
							<span class="truncate max-w-24 text-muted-foreground" title={connectedAddress}>
								{connectedAddress.slice(0, 6)}…{connectedAddress.slice(-4)}
							</span>
						{/if}
						{#if connectedAddress && balanceOg != null}
							<span class="text-muted-foreground/70" aria-hidden="true">·</span>
						{/if}
						{#if balanceOg != null}
							<span class="tabular-nums text-foreground/90">{balanceOg}</span>
						{/if}
					</div>
				{/if}
				<AccountSelect bind:provider />
			</div>
		</div>
	</header>

	<section class="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Messages">
		<ul
			bind:this={messagesListEl}
			class="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-4 overflow-y-auto px-4 py-6"
		>
			{#each $messages as message (message.id)}
				<li
					class={cn(
						'max-w-[85%] shrink-0 rounded-2xl px-4 py-3',
						message.role === 'user'
							? 'self-end bg-primary text-primary-foreground'
							: 'self-start bg-muted/60',
					)}
					data-role={message.role}
					animate:flip={{ duration: 200 }}
				>
					<div class="text-xs font-medium opacity-80">{message.role}</div>
					<div class="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
						{#each message.parts as part, partIndex (partIndex)}
							{#if part.type === 'text'}
								{part.text}
							{/if}
						{/each}
					</div>
				</li>
			{/each}
			{#if messageQueue.length > 0}
				<li
					class="flex w-full shrink-0 items-center gap-3 py-2"
					aria-hidden="true"
					in:fade={{ duration: 150 }}
					out:fade={{ duration: 100 }}
				>
					<span class="flex-1 border-t border-border"></span>
					<span class="text-xs font-medium text-muted-foreground">Queued</span>
					<span class="flex-1 border-t border-border"></span>
				</li>
				{#each messageQueue as text, i (i)}
					<li
						class="max-w-[85%] shrink-0 self-end rounded-2xl border border-dashed border-primary/50 bg-primary/10 px-4 py-3"
						data-role="user"
						data-queued
						animate:flip={{ duration: 200 }}
					>
						<div class="text-xs font-medium opacity-80">queued</div>
						<div class="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
							{text}
						</div>
					</li>
				{/each}
			{/if}
		</ul>

		<div class="shrink-0 border-t border-border bg-background px-4 py-4">
			<div class="mx-auto flex max-w-3xl flex-col gap-4">
				<div class="flex flex-wrap items-end gap-4">
					<div class="flex flex-col gap-1.5">
						<label for="chat-model-select" class="text-xs font-medium text-muted-foreground">Model (hosted on 0G Compute)</label>
						<select
							id="chat-model-select"
							class="min-w-[12rem] rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={selectedProviderAddress}
							onchange={(e) =>
								setProviderAddress((e.target as HTMLSelectElement).value)}
						>
							<optgroup label="0G Compute">
								{#each models as m}
									<option value={m.contract.address}>{m.name}</option>
								{/each}
							</optgroup>
						</select>
					</div>
					<div class="flex min-w-0 flex-1 flex-col gap-1.5">
						<span class="text-xs font-medium text-muted-foreground" id="chat-context-agents-label">iNFT Agents</span>
						<Popover.Root bind:open={comboboxOpen}>
							<Popover.Trigger>
								{#snippet child({ props }: { props: Record<string, unknown> })}
									<div
										{...props}
										class="flex min-h-10 min-w-36 flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_span.chip]:cursor-default"
										role="combobox"
										tabindex="0"
										aria-expanded={comboboxOpen}
										aria-labelledby="chat-context-agents-label"
									>
										{#each contextAgentIds as id}
											{@const agent = agents.find((a) => a.id === id)}
											{#if agent}
												<span class="chip inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
													{agent.name}
													<button
														type="button"
														class="-me-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
														aria-label="Remove {agent.name}"
														onclick={(e) => (e.preventDefault(), e.stopPropagation(), removeAgent(id))}
													>
														×
													</button>
												</span>
											{/if}
										{/each}
										<span class="text-muted-foreground">
											{contextAgentIds.length > 0 ? 'Add…' : 'Select agents…'}
										</span>
										<ChevronsUpDownIcon class="ms-auto size-4 shrink-0 opacity-50" />
									</div>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-72 p-0" align="start">
								<Command.Root>
									<Command.Input placeholder="Search iNFT agents..." aria-label="Search iNFT agents" />
								<Command.List>
									<Command.Empty>No iNFT agent found.</Command.Empty>
									<Command.Group>
										{#each agents as agent (agent.id)}
											<Command.Item
												value="{agent.name} {agent.description}"
												onSelect={() => toggleAgent(agent.id)}
											>
												<CheckIcon
													class={cn(
														'me-2 size-4',
														!contextAgentIds.includes(agent.id) && 'text-transparent',
													)}
												/>
												{agent.name}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
					</div>
				</div>
			</div>
			<form class="mx-auto mt-4 max-w-3xl" onsubmit={handleSubmit}>
				<div class="flex gap-3">
					<input
						type="text"
						class="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
						bind:value={input}
						placeholder="Message..."
						aria-label="Message"
					/>
					<button
						type="submit"
						class="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
						disabled={!input.trim()}
					>
						Send
					</button>
				</div>
			</form>
			{#if messageQueue.length > 0 || waitingOn}
				<p class="mx-auto mt-2 max-w-3xl text-xs text-muted-foreground">
					{#if messageQueue.length > 0}
						Queued: {messageQueue.length} {messageQueue.length === 1 ? 'message' : 'messages'}.
					{/if}
					{#if waitingOn}
						Waiting on: {waitingOn}.
						{#if waitingOn === 'funds'}
							— Create a ledger (3 OG min) and transfer 1 OG to the model provider
							<a href="/chat/account" class="underline underline-offset-2 hover:text-foreground">Account</a>.
							<button
								type="button"
								class="underline underline-offset-2 hover:text-foreground"
								onclick={() => (waitingOn = null)}
							>
								Retry
							</button>
						{/if}
					{/if}
					{#if queueError && !waitingOn}
						<span class="text-destructive">{queueError}</span>
					{/if}
				</p>
			{/if}
		</div>
	</section>
</main>
