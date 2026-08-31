import test from 'node:test'
import assert from 'node:assert/strict'

import { ErrorCode, getTerminalLotteryErrorTitle } from '../src/constants/errorCode.js'

test('依抽獎分類 code 提供結果標題', () => {
  assert.equal(getTerminalLotteryErrorTitle(ErrorCode.LOTTERY_NO_AVAILABLE_PRIZE), '獎品已抽完')
  assert.equal(getTerminalLotteryErrorTitle(ErrorCode.LOTTERY_NOT_CONFIGURED), '活動準備中')
  assert.equal(getTerminalLotteryErrorTitle('CONFLICT'), '')
})
