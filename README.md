# Mamba Hybrid LM Showcase

[Open the live showcase](https://karan-anchan.github.io/mamba-hybrid-lm-showcase/)

Recruiter-facing interface for the Small Mamba-Transformer Hybrid Language Model study. The site turns the
committed experiment evidence into an interactive generation lab, architecture instrument, and concise set of
quality/speed/memory findings.

## Visual system

Version 0.2 uses a signal/state research-poster direction built around the model rather than a general product
template. The asymmetric experiment cover, routing grid, sixteen-layer signal board, oversized ratio specimens,
inference workbench, and publication-style plots are all rendered from HTML, CSS, SVG, and typed evidence.

- Bricolage Grotesque, Instrument Sans, and JetBrains Mono are bundled locally; the page makes no third-party
  font request.
- Cyan, violet, and coral identify the 1:3, 1:7, and 1:15 variants. Signal lime marks primary actions and reading
  progress, while mint and amber keep recurrent/live and recorded states distinct.
- Dark instrumentation and warm-paper light themes share the same information hierarchy and persist locally.
- Motion is attached to reading progress, layer selection, chart comparison, and measured replay. Reduced-motion
  preferences disable nonessential movement.

## Evidence shown

- Three 16-layer models with attention:SSM ratios 1:3, 1:7, and 1:15.
- 700,006,400 sampled training token positions per variant.
- Validation perplexity, sampled-generation throughput, first-token latency, peak allocated VRAM, and logical
  inference-state memory through 8K.
- A derived state-memory crossover near 260 cached tokens.
- Protocol-matched local RTX 5070 and Ryzen 7700 serving measurements.

Every number comes from the committed result bundles in
[`Karan-Anchan/mamba-hybrid-lm`](https://github.com/Karan-Anchan/mamba-hybrid-lm). The interface also preserves
the negative result: none of the three checkpoints retrieved the exact needle at 2K, 4K, or 8K.

## Live and recorded modes

The generation lab has two explicit states:

- **Live model:** when `VITE_API_URL` points to a healthy configured FastAPI service, the browser receives token and
  completion events over SSE. Controls are active and CPU responses do not claim VRAM.
- **Recorded evidence:** when no model host is configured or reachable, the interface replays only the nine exact
  RTX 5070 samples registered in the public evidence. Controls are locked to their measured protocol, custom
  prompts cannot be replayed, and the UI says that the output is recorded.

This boundary keeps the public Pages site useful without pretending static text came from a live process.

## Local development

```bash
npm install
npm run dev
```

To connect the backend:

```bash
VITE_API_URL=http://127.0.0.1:8000 npm run dev
```

On PowerShell, set `$env:VITE_API_URL` before `npm run dev`. Backend startup and endpoint documentation live in
the [main project's demo guide](https://github.com/Karan-Anchan/mamba-hybrid-lm/tree/main/demo).

## Verification

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

The test suite covers evidence identity, layer patterns, state equations, recorded/live presentation boundaries,
theme persistence, responsive overflow, and the measured replay flow. GitHub Actions repeats static, component,
production-build, and Chromium checks before Pages deployment.

## Deployment

The repository deploys its static build to GitHub Pages. An optional repository variable named `VITE_API_URL`
can bind a compatible public FastAPI service at build time. Without it, the deployment remains in recorded
evidence mode by design.

## Related surfaces

- [Main research repository](https://github.com/Karan-Anchan/mamba-hybrid-lm)
- [Information-heavy technical reference](https://karan-anchan.github.io/mamba-hybrid-lm-explained/)
- [Analysis artifacts](https://github.com/Karan-Anchan/mamba-hybrid-lm/tree/main/results)

## License

MIT
