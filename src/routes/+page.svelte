<script lang="ts">
	import LogoZero from '$/components/logo-zero.svelte'
	import { Button } from '$/components/ui/button'

	const sections = [
		{
			title: 'Chat',
			href: '/chat',
			description: '0G Compute testnet chat with Qwen, GPT-OSS, and Gemma models. Stream inference on-chain.',
		},
		{
			title: 'Agents',
			href: '/agents',
			description: 'Discover ERC-7857 iNFT agents and tag them in chat prompts.',
		},
		{
			title: 'Storage',
			href: '/storage',
			description: 'Upload and download files on 0G Storage. Pay with A0GI on testnet.',
		},
		{
			title: 'Explorer',
			href: '/explorer',
			description: 'Browse blocks and transactions on the 0G chain.',
		},
	] as const
</script>

<svelte:head>
	<title>0GUI — Chat with LLMs on 0G Compute, discover ERC-7857 iNFT agents</title>
</svelte:head>

<main class="flex flex-col gap-16 px-6 py-12 sm:px-8 md:gap-24 md:px-12 md:py-20">
	<header class="flex max-w-2xl flex-col gap-6">
		<h1 class="flex items-center gap-0 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
			<LogoZero class="size-[1em] text-primary" /><span class="logo-outline text-foreground">GUI</span>
		</h1>
		<p class="text-lg text-muted-foreground sm:text-xl">
			Chat with LLMs hosted on 0G Compute, and discover ERC-7857 iNFT agents to tag in prompts.
		</p>
		<div class="flex flex-wrap gap-3">
			<Button href="/chat" size="lg">
				Try Chat
			</Button>
			<Button href="/agents" variant="outline" size="lg">
				Discover Agents
			</Button>
			<!-- <Button href="https://build.0g.ai/" variant="outline" size="lg" target="_blank" rel="noopener noreferrer">
				Builder Hub
			</Button> -->
		</div>
	</header>

	<section class="flex flex-col gap-6" aria-labelledby="sections-heading">
		<h2 id="sections-heading" class="text-xl font-semibold text-foreground sm:text-2xl">
			Explore
		</h2>
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each sections as { title, href, description }}
				<li>
					<a
						href={href}
						class="block rounded-lg border border-border bg-card p-5 text-card-foreground transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
					>
						<h3 class="mb-2 font-medium text-foreground">{title}</h3>
						<p class="text-sm text-muted-foreground">{description}</p>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</main>
