export enum Model {
	Qwen = 'Qwen',
	GptOss20b = 'GptOss20b',
	Gemma = 'Gemma',
}

export const models = [
	{
		type: Model.Qwen,
		id: 'qwen',
		name: 'Qwen 2.5 7B Instruct',
		contract: {
			chainId: 16602,
			address: '0xa48f01287233509FD694a22Bf840225062E67836',
		},
	},
	{
		type: Model.GptOss20b,
		id: 'gpt-oss-20b',
		name: 'GPT-OSS 20B',
		contract: {
			chainId: 16602,
			address: '0x8e60d466FD16798Bec4868aa4CE38586D5590049',
		},
	},
	{
		type: Model.Gemma,
		id: 'gemma',
		name: 'Gemma 3 27B IT',
		contract: {
			chainId: 16602,
			address: '0x69Eb5a0BD7d0f4bF39eD5CE9Bd3376c61863aE08',
		},
	},
] as const

export const modelByAddress = Object.fromEntries(
	models.map((m) => [m.contract.address, m]),
) as Record<string, (typeof models)[number]>

export const modelByType = Object.fromEntries(
	models.map((m) => [m.type, m]),
) as Record<Model, (typeof models)[number]>
