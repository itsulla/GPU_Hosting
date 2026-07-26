# Delegated official-source URL health check

**Checked:** 2026-07-26
**Scope:** 97 distinct first-party URLs extracted from the three delegated claim ledgers.

- **Live or redirecting:** 87
- **Stale, moved, DNS-failing, or HTTP 404:** 10

After removing or replacing those stale secondary links, the corrected three-ledger bundle was rechecked: **89/89 distinct remaining URLs returned a live or redirecting response**. The main landscape brief's own URL set was checked separately and also had no failing links.

The ten failed paths below are not treated as current evidence in `LANDSCAPE_RESEARCH_BRIEF.md`:

| Attempted URL | Result | Disposition |
|---|---|---|
| `https://nebius.ai/pricing` | 404 | Use the live product site/docs and obtain a console or sales quote; no public rate claimed. |
| `https://docs.crusoe.ai/` | DNS failure | Removed; current pricing evidence uses `https://www.crusoe.ai/cloud/pricing`. |
| `https://modal.com/docs/guide/pricing` | 404 | Removed; current pricing evidence uses `https://modal.com/pricing`. |
| `https://www.digitalocean.com/pricing/paperspace` | 404 | Replaced with the product page; no rate claimed until live pricing is rechecked. |
| `https://nebius.ai/news` | 404 | No dated Nebius change claim made. |
| `https://modal.com/changelog` | 404 | No dated Modal change claim made. |
| `https://docs.sglang.ai/backend/server_arguments.html` | 404 | Removed; use the official repository/release until the current docs route is located. |
| `https://nvidia.github.io/TensorRT-LLM/quick-start-guide/installation.html` | 404 | Removed; use the official docs root/release. |
| `https://huggingface.co/docs/text-generation-inference/en/references/metrics` | 404 | Removed; no claim depends solely on this route. |
| `https://render.com/docs/metrics` | 404 | Removed; use current Docker/private-service documentation and re-locate observability docs before publication. |

## Important interpretation

A successful HTTP response establishes source availability, not claim correctness. Dynamic price tables, SKU tabs, regional configuration, and release pre-releases still require contextual reading. The main brief therefore separates:

- official hardware specifications;
- provider-advertised configuration;
- current price snapshots;
- release metadata;
- editorial inference;
- claims requiring first-hand testing.
