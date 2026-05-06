const API_BASE_URL = window.endpoint?.lineCrmApiBaseUrl ?? 'https://feature-line-crm.aitago.tw/api'

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    searchParams.append(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const getPointActivities = async (params = {}) => {
  const response = await fetch(`${API_BASE_URL}/liff/point_activities${buildQueryString(params)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(result?.message || '取得集點活動列表失敗')
    error.response = result
    error.status = response.status
    throw error
  }

  return result
}

const getPointActivityDetail = async (activityId, params = {}) => {
  const response = await fetch(
    `${API_BASE_URL}/liff/point_activities/${activityId}${buildQueryString(params)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(result?.message || '取得集點活動詳情失敗')
    error.response = result
    error.status = response.status
    throw error
  }

  return result
}

const getCouponInfo = async (activityId, couponId) => {
  const response = await fetch(`${API_BASE_URL}/liff/point_activities/${activityId}/coupons/${couponId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(result?.message || '取得優惠券資訊失敗')
    error.response = result
    error.status = response.status
    throw error
  }

  return result
}

const redeemCoupon = async (activityId, { couponId, lineUserId }) => {
  const response = await fetch(`${API_BASE_URL}/liff/point_activities/${activityId}/redeem/coupons`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coupon_id: couponId,
      line_user_id: lineUserId,
    }),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(result?.message || '兌換優惠券失敗')
    error.response = result
    error.status = response.status
    throw error
  }

  return result
}

const getUserCouponCode = async (lineUserId, userCouponCodeId) => {
  const response = await fetch(`${API_BASE_URL}/line_users/${lineUserId}/user_coupon_codes/${userCouponCodeId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(result?.message || '取得優惠碼資訊失敗')
    error.response = result
    error.status = response.status
    throw error
  }

  return result
}

export default {
  getPointActivities,
  getPointActivityDetail,
  getCouponInfo,
  redeemCoupon,
  getUserCouponCode,
}
