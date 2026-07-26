# GPUHosting.guide + DeployApp.guide
## Current Landscape Research Brief

**As of:** 2026-07-26
**Recent-signal window:** 2026-06-27 through 2026-07-26
**Purpose:** editorial and product research, not a publication-ready article

## Recommendation

Run a short **content-truth sprint before the content-expansion sprint**.

The sites have a valuable position: they can connect model fit, GPU choice, cloud procurement, serving software, secure deployment, app integration, and economics in one decision path. Most competing pages cover only one layer. But GPUHosting’s current homepage includes hard claims that are contradictory, stale, or insufficiently scoped. Publishing eight new pages from that base would multiply the cleanup problem.

Recommended order:

1. Correct the homepage claim ledger, provider snapshot, calculator assumptions, and deployment security.
2. Build a dated structured-data layer for GPUs, providers, serving engines, formats, and claims.
3. Publish the VRAM guide, RunPod-vs-Vast comparison, and secure rented-GPU deployment guide as one vertical slice.
4. Add the GPU-selection, serving-engine, quantization, and break-even pages.
5. Convert DeployApp’s existing client-side workflows into crawlable pages centered on the deployment failures people actually encounter.

## What I learned

The interesting market movement is not a single new GPU or provider. It is the growing need to move workloads across a volatile combination of GPU models, marketplaces, managed clouds, runtimes, and quantization formats. Recent GitHub activity repeatedly adds or repairs provider abstractions for RunPod, Vast.ai, Lambda and adjacent clouds. That is evidence of demand for portability; it is not evidence that any one abstraction layer is mature enough to recommend without testing.

The serving stack is moving quickly. During this 30-day window, vLLM, Ollama, llama.cpp, and SGLang shipped releases; TensorRT-LLM's latest stable release and TGI's latest tagged release were older, which is itself useful maintenance-cadence evidence. Current vLLM documentation now includes GGUF in its support matrix, directly contradicting GPUHosting’s research document. However, vLLM still labels GGUF as under-optimized and does not support tensor parallelism for it. The useful editorial question is therefore not “which format wins?” but “which format is compatible with the runtime, hardware, topology, and concurrency target?”

Security is a differentiator the current market largely under-explains. vLLM’s own stable documentation says the API server is intended for trusted environments and should not be directly exposed to the internet; some developer endpoints remain unauthenticated even when `--api-key` is used. Ollama’s OpenAI-compatibility examples require an API-key field, but Ollama explicitly says the value is ignored. Ollama binds to `127.0.0.1` by default and can be exposed with `OLLAMA_HOST`, but exposure does not create authentication. GPUHosting can own the “deploy it without accidentally publishing an unauthenticated model endpoint” position.

The fresh provider prices also show why generic “best GPU” and “cheapest cloud” claims age badly. RunPod publishes fixed Community and Secure Cloud rates, while Vast.ai publishes real-time ranges across verified and unverified hosts. A single GPU can be cheaper on Vast at the low end and more expensive at the high end. Lambda is materially more expensive for several comparable accelerators, but presents a more uniform managed-cloud proposition and advertises no egress fees. These are different procurement models, not one sortable price column.

DeployApp’s strongest content opportunity is not another generic platform comparison. Recent deployment evidence clusters around repeatable failure classes: missing production secrets, environment variables scoped to the wrong environment, lockfile/package-manager drift, ephemeral filesystems, database migrations, unpinned database images, OAuth callback URLs, CORS, and accidentally sending provider secrets to browser code. Those failures map cleanly to diagnostic articles and interactive checklists.

## Method and evidence quality

The installed `last30days` skill was run across four broad tracks and four focused supplements using explicit query-plan JSON files. Sources included Reddit, X, Hacker News, and GitHub. First-party validation then used official vendor pages, stable documentation, repository release metadata, and three delegated claim-ledger passes covering hardware/VRAM, providers/pricing, and serving/deployment stacks.

Important limitations:

- YouTube search titles were available, but metadata/transcript retrieval hit YouTube’s VPS bot check. Browser cookies were not enabled.
- Reddit was partially rate-limited on several runs.
- Broad social queries contained substantial unrelated matches. No social post is treated as sufficient evidence for a price, benchmark, security property, or product recommendation.
- Price snapshots below are dated observations, not promises of future availability.
- “No recent discussion found” means this query set did not surface useful evidence; it does not prove the market is inactive.
- The delegated ledgers contained 97 distinct first-party URLs. A fresh automated check returned 87 live/redirecting URLs and 10 stale, moved, DNS-failing, or 404 URLs. No broken URL is treated as current evidence in this brief.

## 1. LLM VRAM requirements

### Verified direction

A defensible estimator must separate at least four budgets:

1. **Model weights:** approximately `parameter_count × bits_per_weight ÷ 8`.
2. **Runtime overhead:** framework allocations, temporary buffers, CUDA graphs, kernels, and allocator fragmentation.
3. **KV cache:** determined by model architecture, context length, cache dtype, concurrent sequences, and batching—not a universal percentage.
4. **Multimodal/adaptor overhead:** vision towers, LoRA adapters, speculative decoding models, and related components when used.

Hugging Face's official memory guidance provides a defensible weights-only starting point: an `X`-billion-parameter model is roughly `4 × X` GB in FP32 and `2 × X` GB in BF16/FP16. Nominal INT8 and INT4 storage begins near one byte and half a byte per parameter, respectively, but scales, metadata, higher-precision modules, embeddings, and runtime allocations mean those are lower-bound estimates rather than loaded-VRAM promises.

For ordinary decoder-only K/V caching, the transparent architecture-derived estimate is:

`KV bytes ≈ 2 × layers × KV heads × head dimension × cached tokens × bytes per KV element`

The factor `2` represents K and V. Use KV heads rather than query heads for GQA/MQA, multiply cached tokens across active sequences, and qualify the estimate for tensor-parallel sharding, MLA, sliding-window attention, prefix caching, offloading, and quantized KV implementations.

For mixture-of-experts models, **total parameters primarily govern weight residency**, while active parameters per token primarily affect compute. Active-parameter count should not be used as if only those weights need to be stored.

Current Ollama documentation makes context length explicitly VRAM-dependent:

| Available VRAM | Ollama default context |
|---|---:|
| Less than 24 GiB | 4K |
| 24–48 GiB | 32K |
| 48 GiB or more | 256K |

Ollama also warns that required memory increases with context length and parallel requests. This is a much stronger teaching device than the current site’s fixed “20% overhead” framing.

A recent NVIDIA NeMo pull request documented a false-negative VRAM preflight on integrated/unified-memory GPUs because `torch.cuda.mem_get_info().free` did not account for reclaimable page cache. That is a useful edge-case note for DGX Spark and unified-memory systems, but should not be generalized to discrete GPUs.

### Required article treatment

The VRAM page should expose inputs for:

- total parameters and architecture type;
- weight precision/quantization;
- context length;
- concurrent sequences;
- KV-cache dtype;
- runtime;
- number of GPUs and tensor-parallel topology;
- safety margin.

Output ranges should be labeled **weights only**, **estimated runtime**, and **recommended capacity**. Do not claim exact fit without a tested model/runtime pair.

## 2. Best GPUs for LLM inference

### Verified current facts

NVIDIA’s official RTX 5090 page lists:

- 32 GB GDDR7;
- 1,792 GB/s memory bandwidth;
- a launch/list price beginning at $1,999.

That makes it an important high-bandwidth 32 GB option. It does **not** establish that it is universally “2.6x faster than A100.” Performance depends on model, precision, runtime, batch size, context, and whether the workload benefits from enterprise features.

The useful buying/rental taxonomy is:

| Capacity class | Likely role | Editorial warning |
|---|---|---|
| 24 GB consumer | smaller models, aggressive quantization, development | fit can fail quickly with long context or concurrency |
| 32 GB consumer | stronger single-GPU local/cloud value | consumer thermals, no ECC, no enterprise interconnect |
| 48 GB workstation/data-center | larger quantized models and safer headroom | often stronger operational value than raw token benchmarks imply |
| 80–96 GB | large models, higher context/concurrency, professional workloads | compare topology and runtime support, not capacity alone |
| 141 GB+ | very large models and enterprise inference | procurement, interconnect and software stack dominate hourly sticker price; name the exact variant |

### Immediate homepage corrections

- Remove the unsupported universal claim that RTX 5090 is “2.6x faster than A100.”
- Remove “Fastest” from the H100 row; it is no longer true as an unqualified market statement.
- Do not hard-code one generic B200 memory number yet. RunPod and Lambda currently describe their B200 offerings as 180 GB, while NVIDIA's reachable live pages did not expose a stable single-B200 specification table. Keep the homepage claim pending a current NVIDIA datasheet and name the exact provider/server configuration; never substitute GB200/NVL72 aggregate memory for one GPU.
- Do not say an A100 80 GB “fits 70B FP16.” The current page’s own FAQ estimates approximately 168 GB including overhead, contradicting that row.
- Treat every tokens-per-second number as a benchmark record requiring model, quantization, runtime, batch/concurrency, context, GPU variant, driver, date, and reproducible command.

## 3. GPU cloud comparison

### Live price snapshot

Rates below were observed on official pages on 2026-07-26. RunPod's embedded first-party price data and rendered table state that the page was updated 2026-07-17. Vast.ai publishes real-time ranges. Prices are per GPU-hour unless noted.

| GPU | RunPod Community | RunPod Secure | Vast unverified range | Vast verified range | Lambda 1× |
|---|---:|---:|---:|---:|---:|
| RTX 4090 24 GB | $0.34 | $0.69 | $0.20–$0.59 | $0.23–$0.60 | — |
| RTX 5090 32 GB | $0.69 | $0.99 | $0.32–$0.88 | $0.34–$0.88 | — |
| RTX A6000 48 GB | $0.33 | $0.49 | $0.27–$0.66 | $0.30–$0.67 | $1.09 |
| A100 PCIe 80 GB | $1.19 | $1.39 | $0.55–$1.36 | $0.61–$1.51 | — |
| H100 PCIe 80 GB | $1.99 | $2.89 | $1.28–$2.34 | $1.40–$2.39 | $3.29 |
| H100 SXM 80 GB | $2.69 | $2.99 | $1.37–$2.46 | $1.39–$2.87 | $4.29 |
| H200 141 GB | $3.59 | $4.39 | variant-dependent | $1.70–$4.86 depending on NVL/SXM offers | — |
| B200 provider listing: 180 GB | $5.89 | $5.89 | $2.81–$6.83 | $2.98–$8.37 | $6.99 |

These rates are not fully apples-to-apples:

- RunPod separates Community and Secure Cloud and prices storage independently.
- Vast varies by host, verification, location, machine, and availability; it also offers on-demand, interruptible, and reserved pricing.
- Lambda advertises uniform instances, on-demand availability, no egress fees, and no long-term contract.
- Exact CPU/RAM allocation, storage, egress, startup time, persistence, networking, support, compliance, and interruption risk can dominate the hourly delta.

### Current RunPod storage snapshot

- Pod container disk: $0.10/GB/month.
- Pod volume disk while running: $0.10/GB/month.
- Pod volume disk while idle: $0.20/GB/month.
- Standard network storage below 1 TB: $0.07/GB/month; the page shows a lower tier above 1 TB and a separate high-performance rate.
- Serverless network volume below 1 TB: $0.07/GB/month, with lower tiered rates at larger sizes.

The site’s current phrase “no idle cost when stopped” is therefore too broad: stopped compute may cost zero, but retained storage can continue billing.

## 4. RunPod vs Vast.ai

### Defensible comparison

**RunPod is the cleaner default for readers who value a more standardized purchasing and deployment experience.** Fixed published rates, Secure/Community tiers, templates, network volumes, and Serverless make the decision surface easier to explain.

**Vast.ai is the stronger option for price discovery and readers willing to evaluate individual marketplace offers.** Its official page exposes real-time ranges, host verification, location, machine characteristics, interruptible pricing, and reserved discounts. That flexibility creates both upside and variance.

### What should not be claimed yet

The recent social/GitHub material does not support a broad statement that one provider is more reliable. A tiny project’s maintainer noted that a provider integration was validated with “two real Vast GPU runs”; that is a good minimum methodology signal, not meaningful market-wide reliability evidence.

The comparison article should include first-hand tests on matched GPUs:

- time from checkout to successful SSH/API health check;
- image/template reliability;
- disk persistence after stop/restart;
- download bandwidth for a fixed model;
- sustained inference under the same runtime/configuration;
- interruption/restart behavior;
- billing after stop/terminate;
- support response path;
- public-network defaults and security controls.

Until those tests exist, label recommendations as procurement-model judgments rather than measured reliability verdicts.

### Wider provider map from the official-source pass

The market should be organized by billing and operational plane, not flattened into one leaderboard:

| Plane | Providers to cover | Editorial treatment |
|---|---|---|
| GPU instances / clusters | RunPod, Lambda, CoreWeave, Crusoe, Nebius, AWS, Google Cloud, Azure, Oracle | separate single-GPU, multi-GPU system, spot, reserved, sales-led and regional capacity |
| Marketplace compute | Vast.ai, TensorDock | prices and host quality are offer-specific; capture timestamp, verification and location |
| Serverless GPU/runtime | RunPod Serverless, Modal, Baseten, Fireworks dedicated deployments | model loading, cold starts, minimum replicas, active billing, volumes and concurrency determine TCO |
| Managed token APIs | Together AI, Fireworks AI, Crusoe, Baseten, Cloudflare Workers AI, Replicate, Hugging Face | compare model revision, input/output/cache pricing, limits and API semantics—not GPU-hour rates |
| Application/control plane | Vercel, Netlify, Railway, Render, Fly.io, Cloudflare AI Gateway | connect applications to inference; do not imply these platforms universally provide arbitrary GPU instances |

Several providers publish only dynamic, console-specific or contact-sales pricing. “No public fixed rate found” is a legitimate result and should not be replaced with third-party estimates.

## 5. vLLM vs Ollama

### Current verified position

Both can expose OpenAI-compatible APIs, so “OpenAI compatible” is no longer a useful dividing line by itself.

**vLLM**

- OpenAI-compatible Chat, Completions, Responses, Transcriptions, Translations, Realtime, and related endpoints in current stable docs.
- Designed around serving, batching, accelerator utilization, distributed operation, and production API workloads.
- Supports an `--api-key` server option, but stable security docs explicitly warn that the server should be treated as software for trusted environments.
- Some developer/debug endpoints remain unauthenticated even when an API key is configured.
- Current stable docs recommend network isolation, firewall rules, or an authenticating reverse proxy.

**Ollama**

- Local-first model lifecycle and simple developer UX.
- Supports parts of the OpenAI API, including chat/completions, responses, models, embeddings, vision, tools, and related parameters documented on its compatibility page.
- Requires an API-key field in OpenAI clients, but Ollama explicitly says the value is ignored.
- Binds to `127.0.0.1:11434` by default; `OLLAMA_HOST` changes exposure.
- Current context defaults scale with available VRAM, and parallelism multiplies effective context allocation.

### Editorial framing

Do not publish “vLLM = production, Ollama = toy.” A better decision matrix is:

- single user versus concurrent service;
- easiest local model management versus serving control;
- supported model/quantization combination;
- multi-GPU topology;
- metrics and operational tooling;
- endpoint exposure and authentication architecture;
- latency target versus throughput target.

### Version snapshot checked 2026-07-26

| Stack | Current release evidence | Publication caveat |
|---|---|---|
| vLLM | v0.26.0, 2026-07-25 | fast-moving; pin docs and image tag to article test |
| Ollama | v0.32.4, 2026-07-25 | OpenAI compatibility is a supported subset, not behavioral identity |
| SGLang | v0.5.16, 2026-07-25 | benchmark exact model/GPU; do not publish “fastest” generally |
| TensorRT-LLM | stable v1.2.1, 2026-04-20 | newer prereleases may exist; distinguish stable from prerelease |
| llama.cpp | b10107, 2026-07-24 | rolling build cadence; architecture/GGUF support is revision-specific |
| Hugging Face TGI | v3.3.7, 2025-12-19 | verify current maintenance and architecture support before a new deployment |

## 6. GGUF vs AWQ/GPTQ

### Critical correction

GPUHosting’s research document says vLLM “fundamentally lacks support” for GGUF. Current stable vLLM documentation contradicts this. Its hardware matrix includes GGUF on NVIDIA, AMD and CPU platforms, with limitations.

### Current compatibility picture

- **GGUF:** strong fit for llama.cpp and Ollama distribution/local workflows; Ollama can import GGUF files. vLLM currently supports GGUF but labels support under-optimized and says tensor parallelism is not supported for GGUF.
- **AWQ:** supported by vLLM across several accelerator classes, but current docs warn that AWQ may have lower speed than an unquantized model for some workloads.
- **GPTQ:** supported by vLLM across NVIDIA and AMD GPU paths in the current matrix; specific kernels/variants such as Marlin matter.
- **FP8:** increasingly important on newer accelerators, but the correct method depends on hardware and runtime. Avoid the current homepage’s blanket “near-lossless” phrasing without model-specific evaluation.

### Better article title and structure

Use **“GGUF, AWQ and GPTQ: Choose by Runtime, Hardware and Workload”**, not a universal quality ranking.

The comparison table should contain:

- primary runtimes;
- supported hardware;
- tensor-parallel support;
- calibration requirement;
- model availability;
- memory reduction;
- measured latency/throughput on a named model;
- quality evaluation method;
- conversion friction;
- known limitations and date checked.

## 7. Deploy vLLM or Ollama on a rented GPU

### Recommended secure architecture

`application/client → authenticated backend or reverse proxy → private/loopback inference endpoint`

Do not teach readers to expose either engine directly to the public internet.

The current GPUHosting vLLM example uses Docker port publishing. It should be changed to bind to loopback or a private interface and should include:

- exact image tag rather than an unpinned floating image;
- loopback/private bind;
- vLLM API key where appropriate;
- reverse-proxy authentication and TLS;
- firewall or provider security-group rules;
- model-cache persistence;
- `/health` verification;
- OpenAI-client verification;
- log inspection and OOM troubleshooting;
- stop/terminate and billing verification;
- a warning that vLLM developer endpoints are not protected by the API key.

For Ollama, keep the default loopback bind and place an authenticating proxy in front when remote access is required. Do not imply that the OpenAI client’s dummy API-key value secures Ollama.

A privacy-first variant using SSH tunneling or Tailscale is editorially differentiated and aligned with the safer default.

## 8. Self-hosted vs API inference break-even

### Current calculator problem

The homepage currently compresses API cost into one blended dollars-per-million figure and makes a generic `10M+ tokens/day` claim. That is not defensible across models and workloads.

Use this cost model instead:

**Self-hosted monthly cost**

`GPU provisioned hours × GPU rate + storage + egress + control-plane fees + observability + redundancy + engineering/operations allowance`

**API monthly cost**

`input tokens × input rate + output tokens × output rate + cached-input charges + tool/search/image/audio charges + minimum or batch adjustments`

Break-even also requires a quality-equivalent model. Comparing a cheaper local model with a materially stronger API model is a product trade-off, not a pure infrastructure calculation.

### Required calculator controls

- separate input and output tokens;
- cached-input percentage;
- provisioned hours versus active generation hours;
- expected utilization and concurrency;
- serverless cold-start tolerance;
- storage and egress;
- redundancy count;
- monthly operations allowance;
- model/API quality-equivalence note;
- dated price-source links.

Do not publish a universal crossover threshold. Publish scenarios and expose every assumption.

## 9. DeployApp.guide: current editorial opportunity

The focused failure-mode run found substantially stronger material than the broad platform-landscape query.

### High-value content cluster

1. **Environment Variables on Vercel, Railway and Netlify**
   - preview versus production scope;
   - changes applying only to new deployments;
   - local development pulls;
   - client-visible prefixes versus server-only secrets;
   - secret rotation and redeploy behavior.

2. **Why an AI-Generated App Works Locally but Fails in Production**
   - missing auth secret;
   - lockfile/package-manager mismatch;
   - absent build/runtime command;
   - filesystem assumptions;
   - OAuth callback URL mismatch;
   - database migration not run;
   - CORS or server/client boundary error.

3. **Persistent Storage and Databases on Railway**
   - Railway volumes persist data but have deployment constraints;
   - a service can have one volume;
   - replicas cannot be used with volumes;
   - redeploys with a volume can incur a small amount of downtime;
   - backups exclude databases deployed from templates, so database-native backup procedures still matter.

4. **Railpack vs Dockerfile: How Railway Builds Your App**
   - Railway made Railpack the default builder for new services on 2026-05-20;
   - Railpack 1.0 shipped on 2026-06-24;
   - the page should explain automatic language/package-manager detection, lockfiles, and when to switch to an explicit Dockerfile.

5. **Connect a Vercel/Railway App to a Private LLM Endpoint**
   - server-side proxy pattern;
   - secret storage;
   - timeout/streaming behavior;
   - CORS avoidance;
   - OpenAI-compatible base URL;
   - authentication boundary;
   - SSH/Tailscale/private-network options.

### Verified Vercel detail

Vercel’s current docs state that environment-variable changes apply only to new deployments and are scoped by Development, Preview, and Production environments. That should be a prominent troubleshooting rule, not a footnote.

## Urgent correction ledger for the current GPUHosting homepage

| Current claim or behavior | Risk | Recommended action |
|---|---|---|
| “RTX 5090 outperforms A100 by 2.6x” | benchmark has no workload/configuration and is presented universally | remove until reproduced and fully specified |
| “RTX 5090 offers the best value in 2026” | unsupported universal recommendation | replace with conditional recommendations by VRAM/workload |
| A100 80 GB “fits 70B FP16” | mathematically contradicts the page’s own ~168 GB estimate | correct immediately |
| B200 listed generically as 192 GB | RunPod/Lambda currently list 180 GB, but no stable NVIDIA single-B200 table was reachable; GB200/NVL72 aggregates differ | mark pending official datasheet and name exact configuration |
| H100 labeled “Fastest” | no longer true as an unqualified market statement | remove |
| vLLM lacks GGUF | stale; current stable vLLM docs support GGUF with limitations | replace with current limitations |
| “no idle cost when stopped” | retained storage can continue billing | qualify compute versus storage |
| `10M+ tokens/day` break-even | hides model, API, uptime, output ratio and ops assumptions | remove universal threshold |
| API price examples including GPT-4o-mini and Claude 3.5 | stale product/pricing labels | refresh from official API pricing and date every snapshot |
| vLLM Docker port published without a security architecture | readers may expose an unauthenticated/debuggable endpoint | bind privately and add proxy/firewall/API-key warnings |
| FP8 called “near-lossless” generally | model/task-specific quality claim | replace with measured, scoped language |
| fixed “20% overhead” VRAM rule | ignores architecture/context/concurrency | replace with component model and ranges |

## Recommended crawlable publishing order

### GPUHosting.guide

1. `/models/llm-vram-requirements/`
2. `/compare/runpod-vs-vast-ai/`
3. `/deploy/secure-vllm-on-rented-gpu/`
4. `/gpus/best-gpus-for-llm-inference/`
5. `/compare/vllm-vs-ollama/`
6. `/guides/gguf-awq-gptq/`
7. `/compare/gpu-cloud-providers/`
8. `/economics/self-hosted-vs-api-inference/`

This order intentionally brings the security guide forward. It is more differentiated than another generic install recipe and gives the provider comparison a practical next step.

### DeployApp.guide

1. `/troubleshooting/works-locally-fails-in-production/`
2. `/guides/environment-variables-vercel-railway-netlify/`
3. `/guides/connect-app-to-private-llm-endpoint/`
4. `/railway/persistent-storage-and-databases/`
5. `/railway/railpack-vs-dockerfile/`
6. `/guides/oauth-callback-urls-custom-domains/`

## Data and evidence system to build

Create structured records rather than copying prices into arbitrary HTML:

- `gpus.json`: exact product, memory, bandwidth, form factor, vendor source, checked date.
- `providers.json`: service tier, GPU, hourly rate/range, storage, egress, billing unit, source, checked date.
- `engines.json`: API compatibility, quantization support, topology, security notes, stable-doc version/date.
- `claims.json`: claim text, evidence class, source URL, scope, checked date, expiry/recheck date.
- `benchmarks/`: command, image/version, model revision, quantization, GPU, driver, runtime, context, concurrency, raw output.

Evidence classes:

- **Official specification**
- **Official current pricing**
- **Official documentation/release**
- **Reproduced benchmark**
- **Operator report**
- **Editorial inference**
- **Unverified lead — do not publish as fact**

Provider prices should carry a short recheck interval. Hardware specifications can carry a longer one. Social/operator findings should never silently become specifications.

## Verified source ledger

| Subject | Primary source |
|---|---|
| RTX 5090 memory and bandwidth | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ |
| RTX PRO 6000 Blackwell family | https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000-family/ |
| NVIDIA A100 | https://www.nvidia.com/en-us/data-center/a100/ |
| NVIDIA H100 SXM/NVL specifications | https://www.nvidia.com/en-us/data-center/h100/ |
| NVIDIA H200 | https://www.nvidia.com/en-us/data-center/h200/ |
| AMD MI300X | https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html |
| Hugging Face model-memory guidance | https://huggingface.co/docs/transformers/main/en/llm_tutorial_optimization |
| Hugging Face KV-cache strategies | https://huggingface.co/docs/transformers/main/en/kv_cache |
| GB200 configuration and memory | https://www.nvidia.com/en-us/data-center/gb200-nvl72/ |
| RunPod GPU and storage pricing | https://www.runpod.io/pricing |
| Vast.ai live pricing ranges | https://vast.ai/pricing |
| Lambda GPU Cloud pricing | https://lambda.ai/pricing |
| CoreWeave GPU pricing | https://www.coreweave.com/gpu-cloud-pricing |
| Crusoe Cloud pricing | https://www.crusoe.ai/cloud/pricing |
| Modal serverless pricing | https://modal.com/pricing |
| Together AI pricing | https://www.together.ai/pricing |
| Fireworks AI pricing | https://fireworks.ai/pricing |
| Baseten pricing | https://www.baseten.co/pricing |
| vLLM OpenAI-compatible server | https://docs.vllm.ai/en/stable/serving/openai_compatible_server.html |
| vLLM security guidance | https://docs.vllm.ai/en/stable/usage/security/ |
| vLLM quantization matrix | https://docs.vllm.ai/en/stable/features/quantization/ |
| Ollama OpenAI compatibility | https://docs.ollama.com/openai |
| Ollama context length | https://docs.ollama.com/context-length |
| Ollama networking FAQ | https://docs.ollama.com/faq |
| Ollama model/GGUF import | https://docs.ollama.com/import |
| Vercel environment variables | https://vercel.com/docs/environment-variables |
| Railway volume behavior | https://docs.railway.com/reference/volumes |
| Railway Railpack overview | https://docs.railway.com/builds/railpack |
| vLLM releases | https://github.com/vllm-project/vllm/releases |
| Ollama releases | https://github.com/ollama/ollama/releases |
| llama.cpp releases | https://github.com/ggml-org/llama.cpp/releases |
| SGLang releases | https://github.com/sgl-project/sglang/releases |
| TensorRT-LLM releases | https://github.com/NVIDIA/TensorRT-LLM/releases |
| Hugging Face TGI releases | https://github.com/huggingface/text-generation-inference/releases |

## Supporting official-source ledgers

- `official-ledgers/LLM_VRAM_CLAIM_LEDGER.md` — hardware variants, weight/KV sizing, and benchmark boundaries.
- `official-ledgers/GPU_CLOUD_PROVIDER_LEDGER.md` — broader provider map, public price examples, billing-plane distinctions, and test checklist.
- `official-ledgers/SERVING_DEPLOYMENT_EVIDENCE.md` — current serving-stack releases, quantization caveats, deployment platforms, and private-endpoint pattern.
- `official-ledgers/SOURCE_HEALTH_CHECK.md` — 97-URL availability check and the ten stale/moved paths excluded from current evidence.

## Decision

The best first build is **not** eight prose pages. It is:

1. the corrected structured claim/pricing layer;
2. a rigorous VRAM calculator article;
3. a measured RunPod-vs-Vast test;
4. a secure vLLM deployment recipe that never exposes the engine directly.

Those four artifacts create a defensible editorial system and a repeatable template for every article that follows.
