<script lang="ts">
	import { page } from '$app/state'
	import LogoZero from '$/components/logo-zero.svelte'
	import '../app.css'

	let { children } = $props()

	const footerLink = $derived(
		(
			{
				'/': { label: '0G Stack', href: 'https://build.0g.ai/' },
				'/chat': { label: '0G Compute', href: 'https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk' },
				'/agents': { label: '0G iNFT', href: 'https://docs.0g.ai/developer-hub/building-on-0g/infts' },
				'/storage': { label: '0G Storage', href: 'https://docs.0g.ai/developer-hub/building-on-0g/storage' },
				'/explorer': { label: '0G Chain', href: 'https://chainscan-galileo.0g.ai/' },
			} as Record<string, { label: string; href: string }>
		)[page.url.pathname] ?? { label: '0G Stack', href: 'https://build.0g.ai/' },
	)
</script>

<div class="flex min-h-screen bg-background">
	<nav
		class="flex w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-[2px_0_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_20px_-4px_rgba(0,0,0,0.25)] min-h-screen"
	>
		<div class="flex min-h-0 flex-1 flex-col p-4">
			<a
				href="/"
				class="mb-3 flex items-center rounded-md px-3 py-2 text-lg font-bold tracking-tight transition-colors {page.url.pathname === '/' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
				aria-label="0GUI home"
			>
				<LogoZero class="size-[1em] text-sidebar-primary" /><span class="logo-outline">GUI</span>
			</a>
			<a
				href="/chat"
				class="rounded-md px-3 py-2 text-sm font-medium transition-colors {page.url.pathname === '/chat' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
			>
				Chat
			</a>
			<a
				href="/agents"
				class="rounded-md px-3 py-2 text-sm font-medium transition-colors {page.url.pathname === '/agents' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
			>
				Agents
			</a>
			<a
				href="/storage"
				class="rounded-md px-3 py-2 text-sm font-medium transition-colors {page.url.pathname === '/storage' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
			>
				Storage
			</a>
		</div>
		<footer class="shrink-0 border-t border-sidebar-border px-4 py-3 text-center text-sm text-sidebar-foreground/70">
			Powered by
			<a
				href={footerLink.href}
				target="_blank"
				rel="noopener noreferrer"
				class="underline underline-offset-2 hover:text-sidebar-foreground"
			>
				{footerLink.label}
			</a>
		</footer>
	</nav>
	<main
		class="min-w-0 flex-1 bg-gradient-to-b from-background via-background to-primary/[0.03] dark:to-primary/[0.06]"
	>
		{@render children()}
	</main>
</div>
