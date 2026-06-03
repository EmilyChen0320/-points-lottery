import liffService from './liffService'

const API_BASE_URL = window.endpoint?.lineCrmApiBaseUrl ?? 'https://feature-line-crm.aitago.tw/api'

const getAuthHeaders = (path) => {
  if (!path.startsWith('/liff/point_activities')) return {}

  const env = liffService.getEnvironment()
  const shouldUseTestMode = !env.enableLiff || env.isLocalhost
  const accessToken = liffService.getAccessToken()

  if (!accessToken) {
    if (shouldUseTestMode) return {}
    throw new Error('LIFF 尚未登入，請重新開啟頁面')
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    searchParams.append(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const request = async (path, { method = 'GET', params = {}, body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(params)}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(path),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const apiMessage =
      result?.message ||
      result?.result?.message ||
      (typeof result?.result === 'string' ? result.result : '') ||
      '請求失敗'
    const error = new Error(apiMessage)
    error.response = result
    error.status = response.status
    throw error
  }

  return result
}

const getPointActivities = (params = {}) =>
  request('/liff/point_activities', { params })

const getPointActivityDetail = (activityId, params = {}) =>
  request(`/liff/point_activities/${activityId}`, { params })

const getLineUserPoints = (activityId, params = {}) =>
  request(`/liff/point_activities/${activityId}/line_user_points`, { params })

const getCheckinSpots = (activityId, params = {}) =>
  request(`/liff/point_activities/${activityId}/checkin-spots`, { params })

const getCouponInfo = (activityId, couponId) =>
  request(`/liff/point_activities/${activityId}/coupons/${couponId}`)

const getLotteryInfo = (activityId, lotteryId, params = {}) =>
  request(`/liff/point_activities/${activityId}/lotteries/${lotteryId}`, { params })

const redeemCoupon = async (activityId, { couponId, lineUserId }) => {
  return request(`/liff/point_activities/${activityId}/redeem/coupons`, {
    method: 'POST',
    body: {
      coupon_id: couponId,
      line_user_id: lineUserId,
    },
  })
}

const redeemLottery = (activityId, { lotteryId, lineUserId }) =>
  request(`/liff/point_activities/${activityId}/redeem/lotteries`, {
    method: 'POST',
    body: {
      lottery_id: lotteryId,
      line_user_id: lineUserId,
    },
  })

const getLotteryTickets = (activityId, lotteryId, params = {}) =>
  request(
    `/liff/point_activities/${activityId}/lotteries/${lotteryId}/line_user_lottery_tickets`,
    { params },
  )

const submitCheckIn = (activityId, payload = {}) =>
  request(`/liff/point_activities/${activityId}/check-in`, {
    method: 'POST',
    body: payload,
  })

const getUserCouponCode = (lineUserId, userCouponCodeId) =>
  request(`/line_users/${lineUserId}/user_coupon_codes/${userCouponCodeId}`)

const getLineUserCouponByCode = (lineUserId, couponCode) =>
  request(`/line_users/${lineUserId}/coupons/${encodeURIComponent(couponCode)}`)

export default {
  getPointActivities,
  getPointActivityDetail,
  getLineUserPoints,
  getCheckinSpots,
  getCouponInfo,
  getLotteryInfo,
  redeemCoupon,
  redeemLottery,
  getLotteryTickets,
  submitCheckIn,
  getUserCouponCode,
  getLineUserCouponByCode,
}
