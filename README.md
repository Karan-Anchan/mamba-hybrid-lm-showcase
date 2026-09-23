# Mamba–Transformer Hybrid LM: experiment showcase

[Open the single-page showcase](https://karan-anchan.github.io/mamba-hybrid-lm-showcase/) · [Model and experiment code](https://github.com/Karan-Anchan/mamba-hybrid-lm)

This page is a compact, recruiter-facing account of one small language-model ablation. It leads with the measured result, then shows the protocol, implementation, limitations, and source artifacts. It is not a general claim that Mamba or attention is faster in every implementation.

## Question and method

At the same **sampled-token budget**, how does changing the attention-to-Mamba-2 layer ratio affect validation perplexity, generation speed, and inference-state memory?

The experiment trained three 16-layer, width-448 variants with 1:3, 1:7, and 1:15 attention:SSM ratios. They shared a 16,000-token byte-level BPE tokenizer, a prepared OpenWebText pool, a 512-token training context, optimizer schedule, batch geometry, and **700,006,400 sampled token positions per variant**. The positions are sampled with replacement; they are not 700 million distinct corpus tokens. Parameter counts are close but unequal (52.53M–54.11M), and FLOPs were **not** matched. This is a matched-token, near-matched-scale comparison, not a fixed-compute experiment. See the [training protocol](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/README.md#training-protocol) and [sweep interpretation](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week3-700m-v1/README.md).

## Measured result

| Attention:SSM | Parameters | Validation PPL ↓ | 48-token sampled generation ↑ | 8K decode ↑ | Logical state at 8K ↓ |
|:--|--:|--:|--:|--:|--:|
| 1:3 | 52.53M | **26.301** | **52.32 tok/s** | 46.8 tok/s | 61.33 MiB |
| 1:7 | 53.58M | 26.466 | 48.26 tok/s | **49.0 tok/s** | 34.22 MiB |
| 1:15 | 54.11M | 26.513 | 48.28 tok/s | 44.6 tok/s | **20.66 MiB** |

The 1:3 variant has the lowest perplexity and highest short sampled-generation rate in this run. The 1:15 variant uses **66.3% less logical inference state at 8K** than 1:3, at a **0.212 perplexity increase**. At approximately 57 cached tokens, the ordering reverses: fixed recurrent state makes 1:3 use 15.4% less state than 1:15. Their calculated state curves cross near 260 tokens. The distinct 8K decode measurement peaks at 1:7; it must not be conflated with the 48-token end-to-end generation rate. These numbers come from the [joined analysis](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week5-analysis-v1/analysis.json), [GPU generation records](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week5-generation-cuda-v1/generation_results.json), and [8K evaluation](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week4-eval-v1/evaluation_results.json).

## How it was built

- **Data and training:** Python 3.11, PyTorch, Hugging Face Datasets and Tokenizers, NumPy `uint16` memory maps. The preparation step pins the OpenWebText revision, records source ranges and hashes, checks split continuity, and promotes a verified staging directory. Training uses bf16 autocast on an RTX 5070, fused AdamW, gradient accumulation, warmup followed by cosine decay, and recoverable checkpoints. [Data preparation](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/src/data/prepare_data.py) · [Training loop](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/src/train/train.py)
- **Model and inference:** A shared configuration builds the layer placement. Each residual block uses either causal attention with PyTorch scaled-dot-product attention or a Mamba-2 SSD mixer, followed by SwiGLU. Stateful inference retains attention K/V tensors or Mamba convolution/recurrent state; long prefills use bounded chunks. [Configuration](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/src/model/config.py) · [Mamba mixer](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/src/model/mamba2.py) · [LM inference](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/src/model/lm.py)
- **Service and page:** FastAPI/Uvicorn expose JSON and Server-Sent Events from verified checkpoints, loading one ratio at a time. This separate React, TypeScript, and Vite site renders the committed measurements and uses the service only when a healthy API is configured. Vitest, Playwright, and GitHub Actions check the static page before GitHub Pages deployment. [Service](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/src/serve/app.py) · [Checkpoint registry](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/src/serve/registry.py) · [Showcase source](src/)

## Challenges and evidence limits

- **Portable kernels changed the speed story.** The training SSD path is plain PyTorch and materializes an `L × L` matrix across Mamba heads. More Mamba layers were slower and used more training VRAM here; that does not establish the performance of fused or linear-scan Mamba kernels. [Sweep notes](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week3-700m-v1/README.md#efficiency-boundary)
- **A run had to be resumed.** Another workload reduced GPU headroom during 1:15 training. The run paused at a verified step-12,500 checkpoint and resumed with model, optimizer, counters, metrics, and RNG restored. Its aggregate training throughput includes that contention. [Sweep notes](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week3-700m-v1/README.md#efficiency-boundary)
- **Long-context execution is not long-context understanding.** All three variants ran through 8K, but each retrieved only 3 of 15 registered access codes; none matched exactly at 2K, 4K, or 8K. Training context was 512 tokens. The generated samples can drift, repeat, or invent facts. [Evaluation protocol and boundary](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week4-eval-v1/README.md) · [Analysis](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week5-analysis-v1/README.md)
- **The result is descriptive.** One training seed, three registered 48-token generation prompts, and one local GPU cannot establish statistical separation or a universal architecture ranking. The GPU rates are medians across those prompts. Logical state is tensor storage, not measured peak CUDA allocation. [Generation protocol](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week5-generation-cuda-v1/generation_results.json) · [Evaluation boundary](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/results/week4-eval-v1/README.md#interpretation-boundary)

## Recorded page versus live model

GitHub Pages hosts the static site, **not** model inference. Without a reachable API, the generation panel replays only the nine committed RTX 5070 prompt/ratio samples and labels them as recorded evidence; custom prompts are unavailable. When `VITE_API_URL` points to a healthy compatible FastAPI service, it can stream a live response. The service keeps one checkpoint loaded at a time and verifies checkpoint identity before loading. [Showcase behavior](src/components/GenerationLab.tsx) · [API guide](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/demo/README.md)

## Run the page locally

```bash
npm install
npm run dev
```

To connect a local model service, configure `VITE_API_URL` as described in the [API guide](https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/demo/README.md). Otherwise the page remains in recorded mode. Check the site with `npm run check` and the browser flow with `npm run test:e2e`.
