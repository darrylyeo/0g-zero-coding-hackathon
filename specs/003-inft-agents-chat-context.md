# Spec 003: iNFT Agents Listing and Chat Context

**Data layer**: See [Spec 000](000-tanstack-db-local-persistence.md). Chat context (selected agent ids) is stored in the chat preferences collection; UI reads and upserts via that collection.

## Scope

- **Agents page** at `/agents` must show **all existing known ERC-7857 iNFT agents**, listed from a **registry** (see Registry and how to query, below). Each agent has a stable id (e.g. `contractAddress:tokenId` or registry-assigned id), name, and description (or placeholder when metadata is encrypted).
- **Chat context** in the existing chat feature (`/chat`): a **multiple combobox** to select one or more iNFT agents to include as context. Selected agents are sent with each chat request; the stream endpoint injects their content (e.g. names and descriptions) as context (e.g. system message) so the model can use them when replying. This aligns with 0G’s **Agent Collaboration** use case: “Combine multiple INFT agents for enhanced capabilities.”
- **Registry**: The app must consume a single source of truth for “known” ERC-7857 agents. Supported options: **(A) Curated manifest** (local or remote), **(B) Indexer API** (e.g. Goldsky subgraph). How to query each is defined below.

## Registry: sources and how to query

There is no single official “ERC-7857 registry” API from 0G today. The following patterns are valid ways to obtain a list of known agents.

### (A) Curated manifest

- **What**: A list of known agents: each entry has at least `id` (string, unique), `name`, `description` (optional). Optional: `contractAddress`, `tokenId` for chain/explorer links.
- **Where**: (1) Local: `src/constants/agents.ts` (or JSON in `static/`) with enum + array + lookup. (2) Remote: a JSON URL (e.g. `INFT_REGISTRY_URL` in env) that returns `{ agents: { id, name, description?, contractAddress?, tokenId? }[] }`.
- **How to query**: (1) Import the local list at build time. (2) At runtime: `fetch(INFT_REGISTRY_URL).then(r => r.json())` and use `agents`; optionally cache in TanStack DB (Spec 000) and refresh on interval or on load.
- **When to use**: Default until an indexer or official registry exists. Allows community or 0G to publish a manifest (e.g. Builder Hub, awesome-0g, or a dedicated JSON endpoint).

### (B) Indexer API (e.g. Goldsky subgraph)

- **What**: A GraphQL (or REST) API that indexes one or more ERC-7857 contracts on 0G Chain (e.g. Galileo testnet 16602) and exposes “all tokens” or “all agents” with public fields (name, description if emitted in events or from contract).
- **0G indexing**: [Goldsky](https://docs.0g.ai/developer-hub/building-on-0g/indexing/goldsky) is the recommended indexer for 0G; subgraphs expose GraphQL. There is no public, pre-deployed “INFT registry” subgraph yet—you would deploy a subgraph that indexes known ERC-7857 contract(s) (e.g. Transfer/Mint events, optional metadata).
- **How to query**: GraphQL, e.g. `query { inftAgents(first: 500) { id, contract, tokenId, name, description } }` (exact schema depends on your subgraph). Endpoint format: `https://api.goldsky.com/api/public/<project-id>/subgraphs/<subgraph-name>/<version>/gn`. Use env (e.g. `GOLDSKY_INFT_SUBGRAPH_URL`) for the endpoint.
- **When to use**: When a subgraph (or other indexer) is available that lists ERC-7857 agents; then the app should call this API and list all returned agents.

### (C) On-chain registry contract (future)

- If 0G or the community deploys a canonical “registry” contract that registers (contract, tokenId) and emits events (or exposes a view), the app could query that contract (or an indexer of it) to list known agents. Not required for this spec until such a contract and query path exist.

## Research: has anyone made an ERC-7857 registry?

**Search (Feb 2025):** No public, dedicated **ERC-7857 agent registry** or **INFT list API** was found.

- **0G / official**: No registry contract, subgraph, or JSON endpoint from 0G or Chainscan that lists ERC-7857 agents. [0g-agent-nft](https://github.com/0gfoundation/0g-agent-nft) is the reference implementation (contracts, scripts, doc) but does not provide a registry or list API.
- **Indexers**: [Goldsky](https://docs.0g.ai/developer-hub/building-on-0g/indexing/goldsky) supports 0G; there is no pre-deployed “INFT registry” subgraph. [Kiwari-Labs/kiwari-indexer](https://github.com/kiwari-labs/kiwari-indexer) indexes ERC-7818/ERC-7858 (different standards), not ERC-7857.
- **Ecosystem**: [awesome-0g](https://github.com/0gfoundation/awesome-0g) lists many 0G projects; several use or mention iNFT/agents (e.g. Warriors AI-rena “basic iNFT”, Context Passport “iNFT minting”, 0Gents MarketPlace, Agents 0G, Concierge “Smart NFT Agent”) but none expose a queryable “list all ERC-7857 agents” registry or API.

**Conclusion:** Use a **curated manifest** (local or remote URL) as the registry until an official or community indexer/registry exists. When a Goldsky subgraph (or similar) for ERC-7857 is published, add support via `GOLDSKY_INFT_SUBGRAPH_URL` (or equivalent) and document the query.

## Research (0G docs)

- **INFTs** = Intelligent NFTs = tokenized AI agents (ERC-7857). They enable ownership, transfer, and capabilities of AI agents in Web3; metadata can be encrypted and stored on 0G Storage; inference runs on 0G Compute.
- **Use cases** (from [INFT Overview](https://docs.0g.ai/developer-hub/building-on-0g/inft/inft-overview)): AI Agent Marketplaces, Personalized Automation (research, analysis, code, content), Enterprise AI, AI-as-a-Service, **Agent Collaboration** (combine multiple INFT agents), IP Monetization.
- **ERC-7857**: Encrypted metadata, secure re-encryption on transfer, oracle verification (TEE/ZKP), `authorizeUsage` for access without ownership. [Technical spec](https://docs.0g.ai/developer-hub/building-on-0g/inft/erc7857); [Integration guide](https://docs.0g.ai/developer-hub/building-on-0g/inft/integration).
- **0G stack for INFTs**: 0G Storage (encrypted metadata), 0G DA (transfer proofs), 0G Chain (contracts), 0G Compute (secure inference). [Indexing with Goldsky](https://docs.0g.ai/developer-hub/building-on-0g/indexing/goldsky) for queryable chain data.

## Non-goals

- Editing or creating iNFT agents in-app.
- Decrypting or fetching private agent payload from chain/0G Storage in this spec; use public or manifest-backed name/description only for listing and context.
- Persisting selected agents across sessions (handled via Spec 000 chat preferences collection).

## Acceptance criteria

- [ ] **Registry**: App uses one registry source (curated manifest and/or indexer API). Registry source and query method are documented (e.g. in this spec or README).
- [ ] **List all known agents**: User can open `/agents` and see a list of **all** existing known ERC-7857 iNFT agents from that registry (name, description or placeholder).
- [x] Nav includes a link to Agents.
- [x] On `/chat`, a multi-select combobox lets the user choose which agents to include as context.
- [x] Submitting a message sends `contextAgentIds: string[]` in the request body; the stream endpoint builds context from the selected agents and injects it (e.g. system message); the model receives that context when generating a reply.

## Todos

- [x] Add `src/constants/agents.ts` with agent enum, array, and lookup by id (curated manifest fallback).
- [ ] Add registry loading: support (A) local manifest and (B) optional remote manifest URL (e.g. `INFT_REGISTRY_URL`) or indexer GraphQL URL (e.g. `GOLDSKY_INFT_SUBGRAPH_URL`); agents page and chat combobox load from registry; document env and query in spec/README.
- [x] Add `routes/agents/+page.svelte` and nav link.
- [x] Add multiple combobox UI in chat; pass `contextAgentIds` to `POST /chat/stream` and implement context injection in stream handler.

## Sources

- [INFT Overview](https://docs.0g.ai/developer-hub/building-on-0g/inft/inft-overview) — tokenized AI agents, use cases, Agent Collaboration
- [INFT Integration Guide](https://docs.0g.ai/developer-hub/building-on-0g/inft/integration) — metadata, transfers, 0G Storage/Compute
- [ERC-7857 Standard](https://docs.0g.ai/developer-hub/building-on-0g/inft/erc7857) — technical spec, TEE/ZKP, authorizeUsage
- [0g-agent-nft (eip-7857-draft)](https://github.com/0gfoundation/0g-agent-nft/tree/eip-7857-draft) — reference implementation
- [Indexing 0G with Goldsky](https://docs.0g.ai/developer-hub/building-on-0g/indexing/goldsky) — subgraphs for queryable chain data
- [Goldsky 0G](https://docs.goldsky.com/chains/0g) — Goldsky CLI and 0G chain setup
- [Goldsky GraphQL endpoints](https://docs.goldsky.com/subgraphs/graphql-endpoints) — public/private endpoint format
- [Develop 0G skill](.cursor/skills/develop-0g/SKILL.md)
- Spec 001 (chat stream, body shape).
- [Spec 000: TanStack DB local persistence](000-tanstack-db-local-persistence.md)
