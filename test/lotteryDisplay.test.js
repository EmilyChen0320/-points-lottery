import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldShowLotteryProbability } from '../src/utils/lotteryDisplay.js'

test('抽獎設定為顯示時顯示中獎機率', () => {
  assert.equal(shouldShowLotteryProbability({ show_probability: true }), true)
})

test('抽獎設定為隱藏時不顯示中獎機率', () => {
  assert.equal(shouldShowLotteryProbability({ show_probability: false }), false)
  assert.equal(shouldShowLotteryProbability({ show_probability: 0 }), false)
})

test('未提供設定時預設不顯示中獎機率', () => {
  assert.equal(shouldShowLotteryProbability({}), false)
  assert.equal(shouldShowLotteryProbability(null), false)
})
