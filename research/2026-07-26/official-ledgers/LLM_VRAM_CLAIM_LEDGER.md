# GPUHosting.guide — LLM VRAM claim ledger

**Research date:** 2026-07-26. **Evidence standard:** first-party manufacturer or project documentation only; no affiliate/SEO sources. Hardware capacity is physical advertised memory, not necessarily all allocatable by a runtime.

## 1. Hardware facts (publication-safe)

| GPU / variant | Official fact | Direct official source / exact section |
|---|---|---|
| **NVIDIA GeForce RTX 5090 (reference/Founders Edition)** | 32 GB GDDR7; 512-bit memory interface; Blackwell architecture. | [NVIDIA GeForce RTX 5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/) — **Specifications** → **Memory Specs: Standard Memory Config; Memory Interface Width; Technology Support: NVIDIA Architecture**. NVIDIA page also warns that add-in-card specifications may vary. |
| **NVIDIA RTX PRO 6000 Blackwell Series** (Workstation / Max-Q / Server family table) | 96 GB GDDR7 with ECC. The family page lists 600 W Workstation Edition, 300 W Max-Q, and 600 W Server variants; do not collapse these into one product. | [RTX PRO 6000 Blackwell Series](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000-family/) — **Specifications** table → **GPU Memory**, **Power Consumption**, **Graphics Bus**. |
| **NVIDIA GeForce RTX 4090** | 24 GB GDDR6X; 384-bit interface; Ada Lovelace. | [GeForce RTX 4090](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/) — **Specifications** → **Memory Specs: Standard Memory Config; Memory Interface Width; Technology Support: NVIDIA Architecture**. |
| **NVIDIA GeForce RTX 3090** | 24 GB GDDR6X; 384-bit interface. | [GeForce RTX 3090](https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090/) — **Specifications** → **Memory Size; Memory Type; Memory Specs: Standard Memory Config; Memory Interface Width**. |
| **NVIDIA A100** (SXM variants) | 40 GB HBM2 or 80 GB HBM2e. NVIDIA's page table lists 80-GB memory bandwidth as 2,039 GB/s; its page describes “over 2 TB/sec” for A100 80GB. | [NVIDIA A100](https://www.nvidia.com/en-us/data-center/a100/) — **Specifications** → **GPU Memory; GPU Memory Bandwidth**. Confirm form factor/variant before quoting a bandwidth number. |
| **NVIDIA H100** | 80 GB HBM3 for H100 SXM; 94 GB per GPU for H100 NVL in NVIDIA's current comparison table. The table lists 3.35 TB/s for H100 SXM; H100 NVL uses two GPUs and 188 GB aggregate HBM3. This live table does not label the 94 GB variant as generic H100 PCIe. | [NVIDIA H100](https://www.nvidia.com/en-us/data-center/h100/) — **Specifications** → **H100 SXM / H100 NVL**, **GPU Memory**, **GPU Memory Bandwidth**; page text **H100 NVL**. Keep “per GPU” and “pair aggregate” separate. |
| **NVIDIA H200** | 141 GB HBM3e; 4.8 TB/s GPU memory bandwidth. | [NVIDIA H200](https://www.nvidia.com/en-us/data-center/h200/) — page text under **H200 GPU** and **Specifications** → **GPU Memory; GPU Memory Bandwidth**. |
| **NVIDIA B200** | **Pending source refresh.** RunPod and Lambda currently describe their B200 provider offerings as 180 GB, but the current NVIDIA pages reachable during this research did not expose a stable single-B200 specification table. Historical launch figures and current provider configurations must not be collapsed into one generic claim. | Use NVIDIA’s current [GB200 NVL72](https://www.nvidia.com/en-us/data-center/gb200-nvl72/) page only for GB200/NVL72-level claims. Do not substitute rack-level memory or provider-advertised usable capacity for one official B200 specification; obtain the current NVIDIA B200 datasheet before publishing. |
| **AMD Instinct MI300X** | 192 GB HBM3; 5.3 TB/s peak memory bandwidth; 8,192-bit memory bus. | [AMD Instinct MI300X](https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html) — **Specifications** → **Memory Type; Peak Memory Bandwidth; Memory ECC Support**; page footnote explains 5.325 TB/s calculation. |
| **AMD Instinct MI325X** | AMD launch material specifies 256 GB HBM3E and about 6 TB/s peak bandwidth, but the live AMD URL was not reachable in this run. Treat as **pending source refresh** and omit from a final article until AMD’s live product/press page is re-verified. | Do not use a reseller/SEO page as a substitute. |

### Hardware wording rules

* Say **“advertised GPU memory capacity”**, not “usable VRAM.” Drivers, CUDA/HIP context, allocator reservations, runtime workspaces, quantization metadata, and KV cache reduce available capacity.
* Specify the variant: H100 SXM vs PCIe; A100 40 GB vs 80 GB; RTX PRO Workstation vs Max-Q vs Server; single B200 vs GB200/GB200 NVL72.
* Multi-GPU capacity is not automatically one pooled memory space. A model may need tensor/pipeline/expert parallelism and interconnect support; capacity and performance depend on runtime and sharding.

## 2. Defensible VRAM-sizing guidance

### Weight lower bound

**Fact / authoritative rule of thumb:** Hugging Face’s *Optimizing LLMs for Speed and Memory* says loading a model with **X billion parameters requires roughly 4 × X GB in float32** and **2 × X GB in bfloat16/float16**. It notes that for inputs shorter than 1,024 tokens, inference memory is often dominated by loading weights.

Source: [Hugging Face — Optimizing LLMs for Speed and Memory](https://huggingface.co/docs/transformers/main/en/llm_tutorial_optimization) — **Model memory anatomy** / **How much memory is needed to load a model?** (the page’s exact wording uses “roughly”).

Publication-safe calculation (decimal GB approximation):

```text
weight_bytes ≈ parameter_count × bytes_per_stored_parameter
FP32 ≈ 4 bytes/parameter
BF16/FP16 ≈ 2 bytes/parameter
INT8 ≈ 1 byte/parameter before scales/metadata
INT4/NF4 ≈ 0.5 byte/parameter before scales/metadata and unquantized layers
```

Quantization is not a promise of exact half/quarter total VRAM. Hugging Face’s *Bitsandbytes* documentation says 8-bit quantization halves memory usage and documents LLM.int8(), NF4/FP4, QLoRA, and `get_memory_footprint`; actual footprint includes scales, metadata, selected higher-precision modules, embeddings/output heads, and runtime allocations. Source: [Bitsandbytes](https://huggingface.co/docs/transformers/main/en/quantization/bitsandbytes) — **LLM.int8(); QLoRA; Quantization examples; Check your memory footprint**.

### KV-cache sizing (formula, not a universal benchmark claim)

For a decoder-only transformer using ordinary K/V caching, a useful architecture-derived estimate is:

```text
KV_bytes ≈ 2 × layers × kv_heads × head_dim × tokens_cached × bytes_per_KV_element
```

Multiply `tokens_cached` by the sum of active sequence lengths (or approximate `concurrency × context_length` for uniform requests). The `2` is K plus V. For GQA/MQA, use **KV heads**, not attention/query heads. For tensor-parallel sharding, divide by the effective TP shard only when the runtime actually shards the KV cache that way. MLA, sliding-window attention, prefix caching, FP8/quantized KV, multimodal components, and runtime-specific layouts change the result.

This is an inference formula from the tensor shapes; label it as an estimate, not an official guarantee. The authoritative runtime evidence is the runtime’s own allocator/configuration:

* [vLLM Engine Arguments](https://docs.vllm.ai/en/latest/configuration/engine_args.html) — **`--kv-cache-memory-bytes`**: per-GPU KV-cache size; if unset, vLLM infers it from `gpu_memory_utilization`; **`--kv-cache-dtype`** controls KV element type; **`--gpu-memory-utilization`** defaults to 0.92 and is per-instance.
* [TensorRT-LLM `trtllm-build`](https://nvidia.github.io/TensorRT-LLM/commands/trtllm-build.html) — **`--max_batch_size`**, **`--max_input_len`**, **`--max_seq_len`**, **`--max_num_tokens`**, **`--kv_cache_type`**, and **`--paged_kv_cache`**. NVIDIA documents `max_seq_len` as total prompt plus output length and `max_batch_size` as maximum requests scheduled.
* [Transformers KV cache strategies](https://huggingface.co/docs/transformers/main/en/kv_cache) — **Cache strategies**; distinguishes dynamic/static/offloaded/quantized caches. The selected cache implementation changes memory behavior.

### Full deployment budget

Use this as a transparent planning model, not a guaranteed capacity formula:

```text
required_VRAM ≈ weights
               + KV_cache(active_tokens, KV dtype, model architecture, parallelism)
               + activations / temporary workspaces
               + runtime allocator/context overhead
               + safety headroom
```

**Safe publication claim:** increasing context length or concurrent active tokens increases KV-cache demand; quantizing weights does not automatically quantize the KV cache; and two servers with the same GPU can fit different model/context/concurrency combinations because runtime, kernel, parallelism, cache policy, and allocator settings differ.

**Do not publish as a universal fact:** “a model fits if VRAM ≥ parameter_count × 2/4/8,” “20% headroom is always enough,” “VRAM scales linearly with context in every attention implementation,” or “N GPUs provide a single additive pool.” These are heuristics that need qualification or measurement.

## 3. What requires benchmark testing

* Actual load success and peak allocated/reserved memory for the exact model revision, tokenizer, quantization format, runtime, CUDA/HIP version, and GPU SKU.
* Maximum context at a stated concurrency, prompt/output mix, batching/scheduling policy, prefix-cache hit rate, and KV-cache dtype.
* Throughput/latency, especially claims such as “tokens/s,” “requests/s,” “real-time,” or “X GPUs equal Y GPUs.” Memory capacity alone cannot establish these.
* Multi-GPU scaling, PCIe vs NVLink/Infinity Fabric effects, tensor/pipeline/expert parallelism, and whether a model’s weights/KV are replicated or sharded.
* Vision/audio models, MoE models, speculative decoding, adapters/LoRA, CUDA graphs, flash-attention implementation, and long-context/rope settings.

## 4. Editorial claim templates

* **Hardware:** “The RTX 5090 has 32 GB of GDDR7 according to NVIDIA’s **Specifications** table.”
* **Weights:** “As a first estimate, X billion parameters require roughly 2X GB in BF16/FP16 or 4X GB in FP32; this excludes KV cache and runtime overhead.”
* **Quantized weights:** “INT4/INT8 reduce weight storage approximately to 0.5/1 byte per parameter before format overhead; validate the loaded footprint.”
* **Capacity:** “Whether it runs depends on weights, KV cache, context, concurrency, runtime allocations, and sharding—not VRAM capacity alone.”
* **Benchmarks:** “Measured on [GPU variant], [runtime/version], [quantization], [context], [concurrency], [prompt/output], and [parallelism].”
