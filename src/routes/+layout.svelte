<script lang="ts">
	import { page } from '$app/state'
	import LogoZero from '$/components/logo-zero.svelte'
	import '../app.css'

	let { children } = $props()

	const navLinks = [
		{ href: '/chat', label: 'Chat' },
		{ href: '/agents', label: 'Agents' },
		{ href: '/storage', label: 'Storage' },
		{ href: '/explorer', label: 'Explorer' },
	] as const

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

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/'
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/')
	}
</script>

<div class="flex min-h-screen bg-background">
	<nav
		class="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-[2px_0_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_20px_-4px_rgba(0,0,0,0.25)]"
	>
		<div class="flex min-h-0 flex-1 flex-col gap-1 p-4">
			<a
				href="/"
				class="mb-2 flex items-center gap-0 rounded-lg px-3 py-2.5 text-lg font-bold tracking-tight transition-colors {isActive('/') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
				aria-label="0GUI home"
			>
				<LogoZero class="size-[1.1em] shrink-0 text-sidebar-primary" />
				<span class="logo-outline">GUI</span>
			</a>
			{#each navLinks as { href, label }}
				<a
					href={href}
					class="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {isActive(href) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
				>
					{label}
				</a>
			{/each}
		</div>
		<footer class="shrink-0 border-t border-sidebar-border px-4 py-3 text-center text-xs text-sidebar-foreground/70">
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
		class="min-w-0 flex-1 overflow-auto bg-gradient-to-b from-background via-background to-primary/[0.06] dark:to-primary/[0.1]"
	>
		{@render children()}
	</main>
</div>
