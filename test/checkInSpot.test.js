import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeCheckInSpot } from '../src/utils/checkInSpot.js'

test('打卡點資料保留後端 image 欄位', () => {
  const spot = normalizeCheckInSpot({
    id: 1,
    name: '風櫃洞',
    image: 'https://example.com/spot.png',
    is_within_radius: true,
  })

  assert.equal(spot.image, 'https://example.com/spot.png')
})

test('未設定 image 時維持空值 fallback', () => {
  const spot = normalizeCheckInSpot({ id: 1, name: '風櫃洞' })

  assert.equal(spot.image, '')
})

test('相容既有 image_url 欄位', () => {
  const spot = normalizeCheckInSpot({
    id: 1,
    image_url: 'https://example.com/legacy-spot.png',
  })

  assert.equal(spot.image, 'https://example.com/legacy-spot.png')
})
