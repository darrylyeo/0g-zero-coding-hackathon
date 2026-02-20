<script lang="ts">
	import { agents } from '$/constants/agents'
</script>

<svelte:head>
	<title>INFT Agents · 0GUI</title>
</svelte:head>

<main class="mx-auto flex max-w-2xl flex-col gap-4 p-4">
	<header>
		<h1 class="text-xl font-semibold">INFT Agents</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Intelligent NFTs (ERC-7857) tokenize AI agents on 0G. You can
			<a
				href="https://docs.0g.ai/developer-hub/building-on-0g/inft/inft-overview"
				class="text-primary underline"
				target="_blank"
				rel="noopener noreferrer"
			>combine multiple INFT agents</a>
			for enhanced capabilities—select agents below as context in Chat so the model uses their capabilities when replying.
		</p>
	</header>

	<ul class="flex flex-col gap-3">
		{#each agents as agent (agent.id)}
			<li class="rounded-lg border border-border bg-card p-4">
				<h2 class="font-medium">{agent.name}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{agent.description}</p>
			</li>
		{/each}
	</ul>

	<p class="text-sm text-muted-foreground">
		<a
			href="https://docs.0g.ai/developer-hub/building-on-0g/inft/integration"
			class="text-primary underline"
			target="_blank"
			rel="noopener noreferrer"
		>INFT Integration Guide</a>
		·
		<a
			href="https://docs.0g.ai/developer-hub/building-on-0g/inft/erc7857"
			class="text-primary underline"
			target="_blank"
			rel="noopener noreferrer"
		>ERC-7857</a>
	</p>
</main>
