# Spec 001: 0G Compute Chat Interface

**Data layer**: See [Spec 000](000-tanstack-db-local-persistence.md). Chat UI uses locally persisted TanStack DB collections as the source of truth; upsert API results (e.g. `listTestnetServices`, `getAccountInfo`) and user input (messages, selected model, selected agents) for caching and persistence.

## Scope

- Chat UI at `/chat` (SvelteKit route `routes/chat`) using 0G Compute testnet.
- Support all three testnet LLM models: Qwen 2.5 7B Instruct, GPT-OSS 20B, Gemma 3 27B IT.
- Constants in `src/constants` (models, networks, rpc) with enum + array + lookup pattern (`Model`, `models`, `modelByAddress`, `modelByType`; `Network`, `networks`, `networkByChainId`; `rpcEndpoints`, `rpcEndpointsByChainId`).
- Server-side broker singleton (`$lib/server/broker`) for wallet, ledger, and inference (getServiceMetadata, getRequestHeaders, processResponse). Env: `OG_COMPUTE_WALLET_PRIVATE_KEY`.
- Prefer SvelteKit remote functions: `listTestnetServices` query in `routes/chat/chat.remote.ts` (replaces a list API). Single `+server.ts` only where needed: `POST /chat/stream` for streaming chat (AI SDK transport requires a URL).
- Integration with Vercel AI SDK: `@ai-sdk/svelte` `useChat`, `streamText` + `toDataStreamResponse`, per-request OpenAI-compatible provider via `@ai-sdk/openai-compatible` using broker endpoint and single-use headers.
- UI reads from Spec 000 collections (e.g. chat messages, chat preferences, testnet services cache, account info cache); remotes/stream results and user actions upsert into those collections.

## Non-goals

- Mainnet models or non-testnet providers.
- In-app ledger setup UI (add-ledger, acknowledge-provider, transfer-to-provider); documented/env only.
- Tools / tool-calling in the chat.
- Supporting other AI chat starter packages beyond the AI SDK Svelte pattern.

## Acceptance criteria

- [x] User can open `/chat` and see a chat UI with model selector and message list.
- [x] Model selector offers exactly the three testnet models (Qwen 2.5 7B, GPT-OSS 20B, Gemma 3 27B IT).
- [x] Sending a message streams the assistant reply and appends user/assistant messages to the list.
- [x] `POST /chat/stream` with `messages` and `providerAddress` returns a UI message stream; invalid or unknown `providerAddress` returns 400.
- [x] Remote query `listTestnetServices()` returns a list of testnet inference services (aligned with `models`).
- [x] All testnet model data (enum, contract addresses, names) is defined in `src/constants` with enum + `as const` array + lookup maps.
- [x] Broker is server-only, uses `OG_COMPUTE_WALLET_PRIVATE_KEY` from env, and connects to 0G testnet RPC via `rpcEndpointsByChainId`.
- [x] `.env.example` documents `OG_COMPUTE_WALLET_PRIVATE_KEY`.
- [ ] Chat messages and chat preferences (model, context agents) are stored in Spec 000 local collections; UI binds via `useLiveQuery`; `listTestnetServices` / `getAccountInfo` results and user inputs are upserted into the relevant collections.

## Todos

- [x] Run `pnpm install --no-frozen-lockfile` and fix any type/lint errors after dependency install.
- [x] (Optional) Add account/setup API routes (e.g. add-ledger, acknowledge-provider, transfer-to-provider) if in-app setup is desired later.
- [x] (Optional) Capture `chatId` from OpenAI-compatible stream and pass to `processResponse` when supported by SDK/API.
- [ ] Integrate Spec 000: wire chat page to local collections (messages, preferences, services cache, account cache); upsert on remote results and user actions.

## Sources

- [SvelteKit remote functions](https://svelte.dev/docs/kit/remote-functions)
- [0g-compute-ts-starter-kit](https://github.com/0gfoundation/0g-compute-ts-starter-kit)
- [0G Compute SDK (docs)](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk)
- [Vercel AI SDK – Svelte quickstart](https://sdk.vercel.ai/docs/getting-started/svelte)
- [Vercel AI SDK – OpenAI-compatible custom provider](https://sdk.vercel.ai/providers/openai-compatible-providers/custom-providers)
- [Vercel AI SDK – Transport / prepareSendMessagesRequest](https://ai-sdk.dev/docs/ai-sdk-ui/transport)
- [@0glabs/0g-serving-broker (npm)](https://www.npmjs.com/package/@0glabs/0g-serving-broker)
- [0G testnet faucet](https://faucet.0g.ai/)
- [Develop 0G skill](.cursor/skills/develop-0g/SKILL.md)
- [Spec 000: TanStack DB local persistence](000-tanstack-db-local-persistence.md)
