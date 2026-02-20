<script lang="ts">
	let { class: className = '' }: { class?: string } = $props()
</script>

<svg
	class="inline-block shrink-0 align-baseline {className}"
	width="20"
	viewBox="0 0 24 24"
	aria-hidden="true"
	fill="none"
	stroke="currentColor"
	stroke-width="3.8"
	stroke-linecap="round"
>
	<circle cx="12" cy="12" r="9" />
	<line x1="6" y1="18" x2="18" y2="6" />
</svg>
