export type Ratio = '1:3' | '1:7' | '1:15'
export type PromptId = 'P1' | 'P2' | 'P3'

export type RatioEvidence = {
  ratio: Ratio
  parameters: number
  attentionLayers: number
  mambaLayers: number
  perplexity: number
  generationTokensPerSecond: number
  timeToFirstTokenSeconds: number
  peakVramMiB: number
  shortStateMiB: number
  state8kMiB: number
  prefill8kTokensPerSecond: number
  decode8kTokensPerSecond: number
}

export type RecordedSample = {
  id: PromptId
  ratio: Ratio
  prompt: string
  completion: string
  tokensPerSecond: number
  timeToFirstTokenSeconds: number
  peakVramMiB: number
  generatedTokens: number
  checkpoint: string
}

export const links = {
  project: 'https://github.com/Karan-Anchan/mamba-hybrid-lm',
  reference: 'https://karan-anchan.github.io/mamba-hybrid-lm-explained/',
  analysis: 'https://github.com/Karan-Anchan/mamba-hybrid-lm/tree/main/results',
  generation: 'https://github.com/Karan-Anchan/mamba-hybrid-lm/tree/main/demo',
  release: 'https://github.com/Karan-Anchan/mamba-hybrid-lm/releases/tag/v0.5',
} as const

export const ratioEvidence: RatioEvidence[] = [
  {
    ratio: '1:3', parameters: 52_525_496, attentionLayers: 4, mambaLayers: 12,
    perplexity: 26.30138705162851, generationTokensPerSecond: 52.32030183586599,
    timeToFirstTokenSeconds: 0.02026410005055368, peakVramMiB: 238.490234375,
    shortStateMiB: 5.71875, state8kMiB: 61.3291015625,
    prefill8kTokensPerSecond: 14143.077462987721, decode8kTokensPerSecond: 46.842699582694266,
  },
  {
    ratio: '1:7', parameters: 53_583_628, attentionLayers: 2, mambaLayers: 14,
    perplexity: 26.465894018681368, generationTokensPerSecond: 48.25828800951542,
    timeToFirstTokenSeconds: 0.021311999997124076, peakVramMiB: 244.61328125,
    shortStateMiB: 6.412109375, state8kMiB: 34.21728515625,
    prefill8kTokensPerSecond: 12126.686572175264, decode8kTokensPerSecond: 49.04992592738305,
  },
  {
    ratio: '1:15', parameters: 54_112_694, attentionLayers: 1, mambaLayers: 15,
    perplexity: 26.51338951003941, generationTokensPerSecond: 48.27955309477808,
    timeToFirstTokenSeconds: 0.02311030006967485, peakVramMiB: 246.80029296875,
    shortStateMiB: 6.7587890625, state8kMiB: 20.661376953125,
    prefill8kTokensPerSecond: 11876.219406857585, decode8kTokensPerSecond: 44.58007933237325,
  },
]

export const prompts: Record<PromptId, string> = {
  P1: 'A practical reason to compare attention with state-space layers is',
  P2: 'In a small language model, memory usage matters because',
  P3: 'The experiment showed that',
}

const checkpointByRatio: Record<Ratio, string> = {
  '1:3': '0995d848d8538a01',
  '1:7': 'e3270576bd358526',
  '1:15': '1ff7ad5454ade632',
}

const completionByRatio: Record<Ratio, Record<PromptId, string>> = {
  '1:3': {
    P1: ' that the state-space layers are more or less the same.\n\nThe study also found that the states where the states are the same are the same in their direction. In general, state-space layers are not the same, but',
    P2: ' of the way the data is interpreted. I mean, the data is a binary and an R type.\n\nSocialized memory and data generation.\n\nSocialized memory and data generation.\n\nSocialized memory and',
    P3: ' the most common type of cellular damage to the human brain is the accumulation of brain cells that are responsible for the damage of the brain.\n\nIn the study, mice were not able to react to the effects of a single cell',
  },
  '1:7': {
    P1: ' the fact that the state is not simply a state. It is, in fact, a state of the real world. (The most important thing is that states do not have to be able to talk about real world problems. If they have',
    P2: ' memory has an equal number of memory-intensive memory-intensive memory-intensive memory-intensive memory-intensive memory-intensive memory-intensive memory-intensive memory-intensive memory-intensive memory-',
    P3: ' after approximately two months, the mice were able to build up more muscle in their arteries than did the mice on the day after.\n\nThe mice had a long period of activity that lasted less than 10 minutes even when they were',
  },
  '1:15': {
    P1: ' that it is possible to compare the two on the basis of their common characteristics. For example, a certain distance is a small distance, and if a certain distance is a distance closer than a certain distance, the distance is a small distance.[',
    P2: ' of the way the operating system works. I started with the operating system, which now contains a function pointers like the �Test� and a �GET� function. I then imported the output from the �Write',
    P3: ' after two months of testing, the mice had no lesions. By the beginning two months, they had decreased their risk of cancer and were more often treated with blood testosterone, increasing their risk of developing cancer.\n\nCoc',
  },
}

const speedByRatio: Record<Ratio, Record<PromptId, number>> = {
  '1:3': { P1: 51.13670503261736, P2: 52.42703303955228, P3: 52.32030183586599 },
  '1:7': { P1: 47.93603415445932, P2: 49.43784535228137, P3: 48.25828800951542 },
  '1:15': { P1: 48.124970929279634, P2: 48.38552131906629, P3: 48.27955309477808 },
}

const ttftByRatio: Record<Ratio, Record<PromptId, number>> = {
  '1:3': { P1: 0.03426350001245737, P2: 0.019876200007274747, P3: 0.02026410005055368 },
  '1:7': { P1: 0.024242699961178005, P2: 0.02082420000806451, P3: 0.021311999997124076 },
  '1:15': { P1: 0.02582879993133247, P2: 0.02311030006967485, P3: 0.02261670003645122 },
}

export const recordedSamples: RecordedSample[] = ratioEvidence.flatMap((variant) =>
  (Object.keys(prompts) as PromptId[]).map((id) => ({
    id,
    ratio: variant.ratio,
    prompt: prompts[id],
    completion: completionByRatio[variant.ratio][id],
    tokensPerSecond: speedByRatio[variant.ratio][id],
    timeToFirstTokenSeconds: ttftByRatio[variant.ratio][id],
    peakVramMiB: variant.peakVramMiB,
    generatedTokens: 48,
    checkpoint: checkpointByRatio[variant.ratio],
  })),
)

export const stateCurves: Record<Ratio, { fixedBytes: number; kvBytesPerToken: number }> = {
  '1:3': { fixedBytes: 5_587_968, kvBytesPerToken: 7_168 },
  '1:7': { fixedBytes: 6_519_296, kvBytesPerToken: 3_584 },
  '1:15': { fixedBytes: 6_984_960, kvBytesPerToken: 1_792 },
}

export const runtimeComparison = {
  cuda: { label: 'RTX 5070 · bf16', tokensPerSecond: 52.32030183586599, ttftMs: 20.26410005055368 },
  cpu: { label: 'Ryzen 7700 · fp32', tokensPerSecond: 40.44415774178293, ttftMs: 27.70169998984784 },
}

export const findings = [
  { value: '66.3%', label: 'less 8K state', body: '1:15 cuts logical inference state versus 1:3 for +0.212 perplexity.' },
  { value: '≈260', label: 'token crossover', body: 'Below this point fixed Mamba state dominates; above it, KV growth dominates.' },
  { value: '+8.4%', label: 'short-run speed', body: '1:3 leads 1:7 in matched sampled generation on the RTX 5070.' },
  { value: '77.3%', label: 'CPU share of GPU', body: 'Ryzen 7700 throughput reaches this share of local RTX 5070 speed.' },
] as const

export function layerPattern(ratio: Ratio): ('mamba' | 'attention')[] {
  const period = ratio === '1:3' ? 4 : ratio === '1:7' ? 8 : 16
  return Array.from({ length: 16 }, (_, index) => (index % period === period - 1 ? 'attention' : 'mamba'))
}

export function sampleFor(ratio: Ratio, promptId: PromptId): RecordedSample {
  const sample = recordedSamples.find((item) => item.ratio === ratio && item.id === promptId)
  if (!sample) throw new Error(`Recorded sample is missing for ${ratio} ${promptId}`)
  return sample
}
