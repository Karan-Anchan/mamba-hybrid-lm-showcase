# Mamba Hybrid LM Showcase

[Open the live showcase](https://karan-anchan.github.io/mamba-hybrid-lm-showcase/)

Recruiter-facing interface for the Small Mamba-Transformer Hybrid Language Model study. It presents the
fixed-compute ablation as an interactive observatory: exact protocol, architecture topology, checkpoint replay,
quality/speed/state evidence, and the complete execution path from tokenization to streamed output.

## Visual system

Version 0.3.10 is a **Selective State Observatory**, not a product-dashboard template. Its scientific-cover hero,
fixed specimen rail, irregular ratio atlas, clipped inference console, cobalt evidence field, acid execution map,
and publication plots deliberately change composition from section to section.

- Newsreader, Unbounded, Instrument Sans, and JetBrains Mono are bundled locally; the page makes no third-party
  font request.
- Ultramarine, vermilion, acid chartreuse, cyan, pink, and spectral paper form distinct experimental regimes
  while keeping the three architecture variants visually separable.
- The atmospheric hero texture and deterministic canvas phase portrait are explicitly marked illustrative. They
  never encode an activation, metric, model topology, or measured result.
- Exact architecture and evidence views remain code-native HTML, CSS, and SVG derived from typed result bundles.
- Dark observatory and bright-paper themes persist locally. Motion follows reading progress, ratio state, layer
  selection, chart comparison, and replay; reduced-motion preferences disable nonessential animation.
- Desktop uses a vertical navigation instrument. Mobile converts the same structure into an accessible fixed
  bottom rail with stable section names and no horizontal overflow.
- The 0.3.1 harmony pass softens only the atmospheric raster, preserves sharp technical overlays, normalizes
  section gutters, and keeps every major display face inside a measured line box at desktop and mobile widths.
- The 0.3.2 grid pass aligns all six hero anchors to one responsive inset and protects the question-to-result gap.
- The 0.3.3 motion pass adds sparse state packets, ambient scanning, pointer-responsive light, topology rerouting,
  in-view chart drawing, ordered execution pulses, and tactile controls. These effects visualize hierarchy, data
  movement, or state change; none of them claim model activity or measured telemetry.
- The 0.3.5 restoration pass returns the owner-supplied emblem and prior hero geometry, while increasing only the
  atmospheric raster blur to 8 px. Canvas signals, typography, controls, and evidence remain sharp.
- The 0.3.6 asset pass installs the final owner-generated state-ribbon and attention-graph emblem at its native
  1080 px resolution, with an explicit cache key shared by the favicon, navigation rail, and closing composition.
- The 0.3.10 focus pass removes the hero routing schematic and places the narrative, selector, result, actions,
  protocol, and disclosure inside one centered frame. Normal screens retain fluid gutters; wide canvases gain
  equal outer margins while the content span stays at or below 1600 px.

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
theme persistence, responsive overflow, reduced-motion collapse, active motion markers, and the measured replay
flow. GitHub Actions repeats static, component, production-build, and Chromium checks before Pages deployment.

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
