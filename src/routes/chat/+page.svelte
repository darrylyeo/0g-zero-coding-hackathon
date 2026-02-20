<script lang="ts">
	import { eq } from '@tanstack/db'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { goto } from '$app/navigation'
	import { sessionsCollection } from '$/lib/db/sessions'
	import { createSession } from '$/lib/db/sessions'

	const DOC_ID = 'sessions' as const
	const sessionsQuery = useLiveQuery((q) =>
		q
			.from({ s: sessionsCollection })
			.where(({ s }) => eq(s.id, DOC_ID)),
	)
	const sessionsDoc = $derived(sessionsQuery.data[0])
	const sessions = $derived(
		sessionsDoc
			? Object.values(sessionsDoc.sessions).sort(
					(a, b) => b.updatedAt - a.updatedAt,
				)
			: [],
	)

	function sessionTitle(session: { messages: { role: string; content: string }[] }) {
		const first = session.messages.find((m) => m.role === 'user')
		const text = first?.content?.trim() ?? ''
		return text.slice(0, 60) + (text.length > 60 ? '…' : '') || 'New chat'
	}

	function formatDate(ts: number) {
		return new Date(ts).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	function newChat() {
		const id = crypto.randomUUID()
		createSession(id)
		goto(`/chat/${id}`)
	}
</script>

<svelte:head>
	<title>Chat · 0GUI</title>
</svelte:head>

<main class="flex h-full min-h-0 flex-col overflow-hidden">
	<header class="shrink-0 border-b border-border bg-background px-4 py-4">
		<div class="mx-auto flex max-w-3xl items-center justify-between">
			<div class="flex items-center gap-3">
				<h1 class="text-lg font-semibold tracking-tight">Chat</h1>
				<a href="/account" class="text-sm text-muted-foreground hover:text-foreground">Account</a>
			</div>
			<button
				type="button"
				class="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
				onclick={newChat}
			>
				New chat
			</button>
		</div>
	</header>

	<section
		class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6"
		aria-label="Sessions"
	>
		<ul class="mx-auto flex w-full max-w-3xl flex-col gap-1">
			{#each sessions as session (session.id)}
				<li>
					<a
						href="/chat/{session.id}"
						class="block rounded-lg border border-transparent px-4 py-3 text-left transition-colors hover:bg-muted/60 hover:border-border"
					>
						<div class="truncate text-sm font-medium">
							{sessionTitle(session)}
						</div>
						<div class="mt-0.5 text-xs text-muted-foreground">
							{formatDate(session.updatedAt)}
							{#if session.messages.length > 0}
								· {session.messages.length} {session.messages.length === 1 ? 'message' : 'messages'}
							{/if}
						</div>
					</a>
				</li>
			{:else}
				<li class="py-12 text-center text-sm text-muted-foreground">
					No chats yet. Start a new chat.
				</li>
			{/each}
		</ul>
	</section>
</main>
