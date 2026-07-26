# Model Lineup Ledger

**Research date:** 2026-07-26
**Cutoff:** claims below describe the registry snapshot on 2026-07-26, not future releases.
**Evidence standard:** Every current claim is projected from `model-registry.js`, whose first listed source is reproduced here. A first-party model card, official repository/configuration, or official provider documentation is required. If a parameter, architecture, license, context, or weight fact is not published, the ledger says **Not published** rather than inferring it.

## Category definitions

- **self-hostable:** public weights are released, the registry has a dated official source, and the record is eligible for deployment review.
- **api-only:** hosted access is documented but weights are not published; an API identifier is not a self-hosting claim.
- **weights-pending:** an official API is available, but the registry explicitly records that full weights are pending; these records are not deployment targets at the cutoff.
- **legacy:** public weights retained for compatibility with existing deployments; not a current-release recommendation.

Parameter and context values in the tables are official specification/documentation claims unless marked **Estimate/formula**. “Released” means public weights, not necessarily an OSI-approved open-source license.

## Claim tables

### self-hostable

| Model | Registry identity | Parameters / context | License / weights | Publication verdict | First-party source |
|---|---|---|---|---|---|
| DeepSeek-V4-Pro | `deepseek-ai/DeepSeek-V4-Pro` | 1600B total / 49B active; 1000000 context | MIT / Released | Publish as public-weights, cluster-scale; deployment sizing requires a cluster | https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro |
| DeepSeek-V4-Flash | `deepseek-ai/DeepSeek-V4-Flash` | 284B total / 13B active; 1000000 context | MIT / Released | Publish as public-weights, smaller sparse deployment candidate | https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash |
| Qwen3.6-27B | `Qwen/Qwen3.6-27B` | 27.8B total / 27.8B active; 262144 context | Apache-2.0 / Released | Publish as public-weights | https://huggingface.co/Qwen/Qwen3.6-27B |
| Qwen3.6-35B-A3B | `Qwen/Qwen3.6-35B-A3B` | 35B total / 3B active; 262144 context | Apache-2.0 / Released | Publish as public-weights | https://huggingface.co/Qwen/Qwen3.6-35B-A3B |
| Kimi-K2.7-Code | `moonshotai/Kimi-K2.7-Code` | 1000B total / 32B active; 262144 context | Modified MIT / Released | Publish as public-weights; cluster-scale | https://huggingface.co/moonshotai/Kimi-K2.7-Code |
| MiniMax-M3 | `MiniMaxAI/MiniMax-M3` | 428B total / 23B active; 1000000 context | MiniMax Model License / Released | Publish as public-weights | https://huggingface.co/MiniMaxAI/MiniMax-M3 |
| Google Gemma 4 26B-A4B | `google/gemma-4-26B-A4B-it` | 25.2B total / 3.8B active; 262144 context | Apache-2.0 / Released | Publish as public-weights; size by total parameters | https://ai.google.dev/gemma/docs/core/model_card_4 |
| OpenAI gpt-oss-120b | `openai/gpt-oss-120b` | 117B total / 5.1B active; 131072 context | Apache-2.0 / Released | Publish as public-weights; marketing name “120b” is not the total | https://huggingface.co/openai/gpt-oss-120b |
| OpenAI gpt-oss-20b | `openai/gpt-oss-20b` | 21B total / 3.6B active; 131072 context | Apache-2.0 / Released | Publish as public-weights; marketing name “20b” is not the total | https://huggingface.co/openai/gpt-oss-20b |
| Meta Llama 4 Scout | `meta-llama/Llama-4-Scout-17B-16E-Instruct` | 109B total / 17B active; 10000000 context | Llama 4 Community License / Released | Publish as public-weights | https://www.llama.com/models/llama-4/ |
| Meta Llama 4 Maverick | `meta-llama/Llama-4-Maverick-17B-128E-Instruct` | 400B total / 17B active; 1000000 context | Llama 4 Community License / Released | Publish as public-weights | https://www.llama.com/models/llama-4/ |
| Mistral Small 4 | `mistralai/Mistral-Small-4-119B-2603` | 119B total / 6B active; 262144 context | Apache-2.0 / Released | Publish as public-weights | https://huggingface.co/mistralai/Mistral-Small-4-119B-2603 |
| Mistral Large 3 | `mistralai/Mistral-Large-3-675B-Instruct-2512` | 675B total / 41B active; 262144 context | Apache-2.0 / Released | Publish as public-weights; cluster-scale | https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512 |
| Sarvam-105B | `sarvamai/sarvam-105b` | 106B total / 10.3B active; 131072 context | Apache-2.0 / Released | Publish as public-weights | https://huggingface.co/sarvamai/sarvam-105b |

### api-only

| Model | API ID | Parameters / context | License / weights | Publication verdict | First-party source |
|---|---|---|---|---|---|
| Claude Fable 5 | `claude-fable-5` | Not published / 1000000 context | Proprietary API terms / Not published | API-only; do not describe as self-hostable | https://platform.claude.com/docs/en/about-claude/models/overview |
| Claude Opus 5 | `claude-opus-5` | Not published / 1000000 context | Proprietary API terms / Not published | API-only; do not describe as self-hostable | https://platform.claude.com/docs/en/about-claude/models/overview |
| Claude Sonnet 5 | `claude-sonnet-5` | Not published / 1000000 context | Proprietary API terms / Not published | API-only; do not describe as self-hostable | https://platform.claude.com/docs/en/about-claude/models/overview |
| qwen3.8-max-preview | `qwen3.8-max-preview` | Not published / Not published | Proprietary API terms / Not published | Restricted API preview; no public weights | https://help.aliyun.com/zh/model-studio/models |

### weights-pending

| Model | API ID | Parameters / context | License / weights | Publication verdict | First-party source |
|---|---|---|---|---|---|
| Kimi K3 | `kimi-k3` | 2800B total / active Not published; 1000000 context | Not published / Pending; scheduled 2026-07-27 | API available, but weights are pending and **not a deployment target on the 2026-07-26 cutoff** | https://platform.kimi.ai/docs/guide/kimi-k3-quickstart |

### legacy

| Model | Registry identity | Parameters / context | License / weights | Publication verdict | First-party source |
|---|---|---|---|---|---|
| Mixtral 8x7B (legacy) | `mistralai/Mixtral-8x7B-v0.1` | 46.7B total / 12.9B active; 32768 context | Apache-2.0 / Released | Legacy compatibility only | https://huggingface.co/mistralai/Mixtral-8x7B-v0.1 |
| Mixtral 8x22B (legacy) | `mistralai/Mixtral-8x22B-v0.1` | 141B total / 39B active; 65536 context | Apache-2.0 / Released | Legacy compatibility only | https://huggingface.co/mistralai/Mixtral-8x22B-v0.1 |
| Meta Llama 3.1 405B (legacy) | `meta-llama/Llama-3.1-405B-Instruct` | 405B total / 405B active; 131072 context | Llama 3.1 Community License / Released | Legacy compatibility only | https://huggingface.co/meta-llama/Llama-3.1-405B-Instruct |
| Meta Llama 3.3 70B (legacy) | `meta-llama/Llama-3.3-70B-Instruct` | 70B total / 70B active; 131072 context | Llama 3.3 Community License / Released | Legacy compatibility only | https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct |

## Explicit planning examples — Estimate/formula, not specifications

These are planning arithmetic only, not claims that the first-party sources publish a VRAM requirement. Formula: `total parameters × 4 bits ÷ 8 = weight-only bytes`, using decimal GB/TB for the examples. Metadata, runtime workspaces, scales, tokenizer/state, KV cache, activations, concurrency, and headroom are excluded.

- **Estimate/formula — DeepSeek-V4-Pro:** 1.6T × 0.5 bytes ≈ **800GB** of 4-bit weight-only storage. It is not an 800GB whole-runtime guarantee.
- **Estimate/formula — Kimi K3:** 2.8T × 0.5 bytes ≈ **1.4TB** hypothetical 4-bit weight-only storage. The weights are pending until 2026-07-27, so Kimi K3 is **not a deployment target on the cutoff**.
- **Estimate/formula — Google Gemma 4 26B-A4B:** 25.2B × 0.5 bytes ≈ **12.6GB**, **not 8GB**. Weight residency uses total parameters, not only the 3.8B active parameters.
- **Estimate/formula — gpt-oss naming:** the “120b” and “20b” marketing names correspond to **117B** and **21B total** parameters in the official records; active counts are 5.1B and 3.6B. Do not size weights from the marketing labels alone.

No formula estimate changes a category, weights status, deployment verdict, or first-party claim. Current facts must be reconciled against the registry and this dated ledger at every publication refresh.
