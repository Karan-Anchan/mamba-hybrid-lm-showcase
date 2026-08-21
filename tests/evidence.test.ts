import { layerPattern, ratioEvidence, recordedSamples, sampleFor, stateCurves } from '../src/data/evidence'
import { expect, test } from 'vitest'


test('evidence contains three ratios and nine real recorded samples', () => {
  expect(ratioEvidence.map((item) => item.ratio)).toEqual(['1:3', '1:7', '1:15'])
  expect(recordedSamples).toHaveLength(9)
  expect(recordedSamples.every((sample) => sample.generatedTokens === 48)).toBe(true)
  expect(sampleFor('1:3', 'P1').checkpoint).toBe('0995d848d8538a01')
})


test.each([
  ['1:3', 4], ['1:7', 2], ['1:15', 1],
] as const)('%s pattern contains the certified attention count', (ratio, attentionCount) => {
  const pattern = layerPattern(ratio)
  expect(pattern).toHaveLength(16)
  expect(pattern.filter((layer) => layer === 'attention')).toHaveLength(attentionCount)
})


test('state equations reproduce the 8K evidence and crossover direction', () => {
  const at8k = (ratio: keyof typeof stateCurves) => {
    const curve = stateCurves[ratio]
    return (curve.fixedBytes + curve.kvBytesPerToken * 8192) / 2 ** 20
  }
  expect(at8k('1:3')).toBeCloseTo(61.3291, 4)
  expect(at8k('1:15')).toBeCloseTo(20.6614, 4)
  expect(stateCurves['1:3'].fixedBytes).toBeLessThan(stateCurves['1:15'].fixedBytes)
  expect(stateCurves['1:3'].kvBytesPerToken).toBeGreaterThan(stateCurves['1:15'].kvBytesPerToken)
})
