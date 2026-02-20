# Spec 004: Simple Block Explorer with Tx Explain (0G Compute)

**Data layer**: See [Spec 000](000-tanstack-db-local-persistence.md). Explorer uses TanStack DB for: (1) selected network preference; (2) cache of transaction explanations keyed by tx hash (and optionally chain) so repeated "Explain" hits are local-first.

## Scope

- **Block explorer** at `/explorer` (SvelteKit route `routes/explorer`). Networks from `src/constants` (networks, rpcEndpointsByChainId). User selects network; app uses **viem** to subscribe to latest block height and maintains a **rotating list of the 10 latest blocks** with their transactions.
- **UI**: Network selector (dropdown). Live block height display. List of 10 blocks; each block is a **shadcn-style collapsible** (bits-ui Collapsible). Block summary uses **`<dl>`** (term/description); inside each block, list of transactions, each tx also in a collapsible with `<dl>` for tx fields (hash, from, to, value, gas, etc.).
- **Explain button** per transaction: sends transaction data (serialized for LLM: hash, from, to, value, gas, input slice, etc.) to the **0G Compute** LLM (same broker as Spec 001); response is **streamed** back and shown **inline** under the tx. **TanStack DB** caches completed explanations by tx hash (and chain id) so revisiting the same tx shows cached explanation; streaming in progress is ephemeral until finished, then upserted into the cache.
- **Server**: `POST /explorer/explain/stream` (or similar) that accepts serialized tx payload and optional `providerAddress`, uses broker + `streamText` to prompt the model to explain the transaction, returns a data stream (same transport as chat). Client uses `useChat` or raw fetch + ReadableStream to consume and display; on stream end, client upserts explanation into the tx-explanations collection.

## Non-goals

- Full chain scan or historical pagination beyond the 10 latest blocks.
- Wallet or signing in the explorer.
- Explaining internal txs or traces; only top-level tx data.

## Acceptance criteria

- [ ] User can open `/explorer` and select a network from constants (0G Testnet, 0G Mainnet).
- [ ] Latest block height updates live (viem `watchBlockNumber` or equivalent).
- [ ] Rotating list of 10 most recent blocks is shown; each block expandable (collapsible) with `<dl>` for block fields and a list of transactions.
- [ ] Each transaction is in a collapsible with `<dl>` for tx details; an "Explain" button sends tx data to 0G Compute and streams an explanation inline.
- [ ] TanStack DB collection caches explanations by tx hash (and chain id); cached explanation is shown immediately when available; new requests stream then upsert on completion.
- [ ] Nav includes a link to Explorer.

## Todos

- [ ] Add viem dependency; add Collapsible UI (bits-ui) under `$components/ui/collapsible`.
- [ ] Add TanStack DB collections: explorer preferences (selected chain id), tx explanations cache (key: `${chainId}:${txHash}`, value: full explanation text).
- [ ] Implement `/explorer` page: network selector, viem public client, subscribe to block number, fetch last 10 blocks with transactions, render with collapsibles and `<dl>`.
- [ ] Implement `POST /explorer/explain/stream`: accept tx payload + optional providerAddress, broker + streamText with "Explain this transaction: ..." prompt, return data stream.
- [ ] Explorer UI: Explain button triggers stream, show streamed text inline; on finish upsert to explanations collection; when opening a tx, read from collection first and show cached if present.

## Sources

- [Spec 000: TanStack DB local persistence](000-tanstack-db-local-persistence.md)
- [Spec 001: 0G Compute Chat](001-0g-compute-chat.md) (broker, stream endpoint pattern)
- [viem: watchBlockNumber, getBlock](https://viem.sh/docs/actions/public/watchBlockNumber.html)
- [Bits UI Collapsible](https://bits-ui.com/docs/components/collapsible)
- [Develop 0G skill](.cursor/skills/develop-0g/SKILL.md)
