<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check'
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down'
	import { eq } from '@tanstack/db'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { useChat } from '@ai-sdk/svelte'
	import { agents } from '$/constants/agents'
	import { models } from '$/constants/models'
	import {
		chatPreferencesCollection,
		upsertChatPreferences,
	} from '$/lib/db/chat-preferences'
	import AccountSelect from '$/components/account-select.svelte'
	import * as Command from '$/components/ui/command'
	import * as Popover from '$/components/ui/popover'
	import { cn } from '$/lib/utils'

	let provider = $state<import('$lib/eip6963').EIP1193Provider | null>(null)
	let comboboxOpen = $state(false)
	let input = $state('')

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
		if (!input.trim()) return
		chat.append(
			{ role: 'user', content: input },
			{
				body: {
					providerAddress: selectedProviderAddress,
					contextAgentIds,
				},
			},
		)
		input = ''
	}
</script>

<svelte:head>
	<title>Chat · 0GUI</title>
</svelte:head>

<main class="flex min-h-dvh flex-col">
	<header class="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-4">
		<div class="mx-auto flex max-w-3xl w-full items-center justify-between">
			<h1 class="text-lg font-semibold tracking-tight">Chat</h1>
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-muted-foreground" id="chat-wallet-label">Wallet</span>
				<AccountSelect bind:provider />
			</div>
		</div>
	</header>

	<section class="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Messages">
		<ul class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-auto px-4 py-6">
			{#each $messages as message (message.id)}
				<li
					class={cn(
						'max-w-[85%] rounded-2xl px-4 py-3',
						message.role === 'user'
							? 'self-end bg-primary text-primary-foreground'
							: 'self-start bg-muted/60',
					)}
					data-role={message.role}
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
		</ul>

		<div class="shrink-0 border-t border-border bg-background px-4 py-4">
			<form class="mx-auto max-w-3xl" onsubmit={handleSubmit}>
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
						disabled={!provider}
					>
						Send
					</button>
				</div>
			</form>
			<div class="mx-auto mt-4 flex max-w-3xl flex-col gap-4">
				<div class="flex flex-wrap items-end gap-4">
					<div class="flex flex-col gap-1.5">
						<label for="chat-model-select" class="text-xs font-medium text-muted-foreground">Model</label>
						<select
							id="chat-model-select"
							class="min-w-[12rem] rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={selectedProviderAddress}
							onchange={(e) =>
								setProviderAddress((e.target as HTMLSelectElement).value)}
						>
							{#each models as m}
								<option value={m.contract.address}>{m.name}</option>
							{/each}
						</select>
					</div>
					<div class="flex min-w-0 flex-1 flex-col gap-1.5">
						<span class="text-xs font-medium text-muted-foreground" id="chat-context-agents-label">iNFT Agents</span>
						<Popover.Root bind:open={comboboxOpen}>
							<Popover.Trigger>
								{#snippet child({ props }: { props: Record<string, unknown> })}
									<button
										type="button"
										{...props}
										class="flex min-h-10 min-w-36 flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_span.chip]:cursor-default"
										role="combobox"
										aria-expanded={comboboxOpen}
										aria-labelledby="chat-context-agents-label"
									>
										{#each contextAgentIds as id}
											{@const agent = agents.find((a) => a.id === id)}
											{#if agent}
												<span
													class="chip inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
													onclick={(e) => e.stopPropagation()}
												>
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
									</button>
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
		</div>
	</section>
</main>
