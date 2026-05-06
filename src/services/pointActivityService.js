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

export default {
  getPointActivities,
}
