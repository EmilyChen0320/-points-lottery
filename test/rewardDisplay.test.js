import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatDrawPrizeTitle,
  hasRewardItems,
  isPointsPrize,
} from '../src/utils/rewardDisplay.js'

test('只有存在優惠券資料時才顯示優惠券區塊', () => {
  assert.equal(hasRewardItems([]), false)
  assert.equal(hasRewardItems(null), false)
  assert.equal(hasRewardItems([{ id: 'coupon-1' }]), true)
})

test('點數獎品標題補上點單位', () => {
  assert.equal(isPointsPrize({ type: 'points' }), true)
  assert.equal(formatDrawPrizeTitle({ type: 'points', content: 5 }), '5 點')
  assert.equal(formatDrawPrizeTitle({ prize_type: 'points', name: '10' }), '10 點')
  assert.equal(formatDrawPrizeTitle({ type: 'points', name: '20 點' }), '20 點')
})

test('非點數獎品維持原標題', () => {
  assert.equal(formatDrawPrizeTitle({ type: 'physical_prize', name: '保溫瓶' }), '保溫瓶')
  assert.equal(formatDrawPrizeTitle({ type: 'coupon', name: '折價券' }), '折價券')
})
