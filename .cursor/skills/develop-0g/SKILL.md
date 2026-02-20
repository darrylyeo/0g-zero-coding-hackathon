---
name: develop-0g
description: Guides development on 0G Network (fastest AI L1). Use when building storage, compute, DA, or INFT features; integrating 0G SDKs; or when the user mentions 0G, 0g.ai, Builder Hub, or hackathon on 0G.
---

# Develop on 0G

0G is the fastest AI L1 for onchain AI. Use this skill when adding storage, compute, data availability, or INFTs.

## Hub and docs

- **Builder Hub**: https://build.0g.ai/
- **Docs**: https://docs.0g.ai/ (index: https://build.0g.ai/documentation/)
- **Hacker guide** (hackathons): https://build.0g.ai/hacker-guide/

## SDKs and installs

| Use case | Package | Install |
|----------|---------|--------|
| General 0G (TS) | `@0glabs/0g-ts-sdk` | `npm install @0glabs/0g-ts-sdk` |
| Serving / inference (TS) | `@0glabs/0g-serving-user-broker` | `npm install @0glabs/0g-serving-user-broker` |
| Python inference + storage | `python-0g` | `pip install python-0g` |
| Data availability (Rust) | `0g-da-rust-sdk` | `cargo add 0g-da-rust-sdk` |
| Chain framework (Go) | Cosmos SDK fork | `go get github.com/0gfoundation/cosmos-sdk` |
| EVM on Cosmos (Go) | Ethermint | `go get github.com/0gfoundation/ethermint` |

## Starter kits (clone)

- **Compute (TS)**: `git clone https://github.com/0gfoundation/0g-compute-ts-starter-kit`
- **Storage web (TS)**: `git clone https://github.com/0gfoundation/0g-storage-web-starter-kit`
- **Storage (TS)**: `git clone https://github.com/0gfoundation/0g-storage-ts-starter-kit`
- **Storage (Go)**: `git clone https://github.com/0gfoundation/0g-storage-go-starter-kit`

## Tools

- **Testnet faucet**: https://faucet.0g.ai/
- **Storage scan**: https://storagescan-galileo.0g.ai/
- **Chain scan (testnet)**: https://chainscan-galileo.0g.ai/
- **Chain scan (mainnet)**: https://chainscan.0g.ai/
- **RPC**: QuickNode, ThirdWeb (Galileo testnet), Ankr — see https://build.0g.ai/tools/

## Doc topics (docs.0g.ai)

- Getting started: Quick Start, Understanding 0G, Testnet overview
- Storage: Storage SDK/API
- Compute: Compute Network SDK, CLI
- Data availability: DA client nodes, technical deep dive, rollups/appchains
- INFTs: INFTs overview, integration guide, ERC-7857

When implementing a feature, prefer the official SDK for the stack (e.g. `@0glabs/0g-ts-sdk` or starter kit for TS). For API details and code patterns, see [reference.md](reference.md) or the official docs.
