import test from 'node:test'
import assert from 'node:assert/strict'

globalThis.window = {
  endpoint: {
    enableLiff: false,
    lineCrmApiBaseUrl: 'https://example.test/api',
  },
  location: { hostname: 'localhost' },
}

const { ApiError, default: pointActivityService } = await import(
  '../src/services/pointActivityService.js'
)

const mockResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

test('抽不到獎品時保留 409、分類 code 與頂層中文訊息', async () => {
  globalThis.fetch = async () =>
    mockResponse(409, {
      status: 'conflict',
      statusCode: 409,
      message: '獎品已全數抽完，感謝參與！',
      code: 'LOTTERY_NO_AVAILABLE_PRIZE',
      result: {},
    })

  await assert.rejects(
    pointActivityService.redeemLottery('activity-1', {
      lotteryId: 'lottery-1',
      lineUserId: 'U_TEST',
    }),
    (error) => {
      assert.equal(error instanceof ApiError, true)
      assert.equal(error.status, 409)
      assert.equal(error.code, 'LOTTERY_NO_AVAILABLE_PRIZE')
      assert.equal(error.message, '獎品已全數抽完，感謝參與！')
      return true
    },
  )
})

test('活動未設定時不可重試且不讀取 result.message', async () => {
  globalThis.fetch = async () =>
    mockResponse(409, {
      status: 'conflict',
      statusCode: 409,
      message: '活動設定中，請稍後再試',
      code: 'LOTTERY_NOT_CONFIGURED',
      result: { message: '不應顯示的舊格式訊息' },
    })

  await assert.rejects(
    pointActivityService.redeemLottery('activity-1', {
      lotteryId: 'lottery-1',
      lineUserId: 'U_TEST',
    }),
    (error) => {
      assert.equal(error.message, '活動設定中，請稍後再試')
      assert.equal(error.code, 'LOTTERY_NOT_CONFIGURED')
      return true
    },
  )
})

test('一般中文錯誤信封直接顯示頂層 message', async () => {
  globalThis.fetch = async () =>
    mockResponse(500, {
      status: 'error',
      statusCode: 500,
      message: '伺服器錯誤',
      code: 'INTERNAL_SERVER_ERROR',
      result: {},
    })

  await assert.rejects(pointActivityService.getPointActivities(), (error) => {
    assert.equal(error.message, '伺服器錯誤')
    assert.equal(error.code, 'INTERNAL_SERVER_ERROR')
    return true
  })
})

test('401 中文信封保留認證 code 與訊息', async () => {
  globalThis.fetch = async () =>
    mockResponse(401, {
      status: 'unauthorized',
      statusCode: 401,
      message: '未經授權',
      code: 'AUTH_TOKEN_INVALID',
      result: {},
    })

  await assert.rejects(pointActivityService.getPointActivities(), (error) => {
    assert.equal(error.status, 401)
    assert.equal(error.code, 'AUTH_TOKEN_INVALID')
    assert.equal(error.message, '未經授權')
    return true
  })
})

test('422 驗證錯誤保留 result.errors 結構', async () => {
  const errors = { line_user_id: ['LINE 使用者 ID 為必填欄位。'] }
  globalThis.fetch = async () =>
    mockResponse(422, {
      status: 'unprocessable entity',
      statusCode: 422,
      message: '資料驗證失敗',
      code: 'UNPROCESSABLE_ENTITY',
      result: { errors },
    })

  await assert.rejects(pointActivityService.getPointActivities(), (error) => {
    assert.equal(error.status, 422)
    assert.equal(error.message, '資料驗證失敗')
    assert.deepEqual(error.result?.errors, errors)
    return true
  })
})
