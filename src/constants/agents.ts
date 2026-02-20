export enum AgentId {
	Research = 'research',
	CodeReview = 'code-review',
	Writer = 'writer',
}

export const agents = [
	{
		id: AgentId.Research,
		name: 'Research Assistant',
		description:
			'Personalized automation for research and analysis. Use when you need factual answers, literature summaries, or structured findings.',
	},
	{
		id: AgentId.CodeReview,
		name: 'Code Reviewer',
		description:
			'Reviews code for style, security, and best practices. Use when you want feedback on snippets or PRs.',
	},
	{
		id: AgentId.Writer,
		name: 'Content Writer',
		description:
			'Helps draft and refine copy, docs, and structured content. Use for blogs, docs, or marketing text.',
	},
] as const

export const agentById = Object.fromEntries(
	agents.map((a) => [a.id, a]),
) as Record<string, (typeof agents)[number]>
