import { defineStore } from 'pinia'
import pointActivityService from '../services/pointActivityService'

const fallbackImages = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&q=80',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=80',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&q=80',
]

const formatDatePart = (value) => {
  if (!value) return '--/--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--/--'

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

const formatPeriod = (startAt, endAt) => `${formatDatePart(startAt)} ～ ${formatDatePart(endAt)}`

const getActivityStatus = (endAt) => {
  if (!endAt) return 'ongoing'

  const endDate = new Date(endAt)
  if (Number.isNaN(endDate.getTime())) return 'ongoing'

  return endDate.getTime() < Date.now() ? 'ended' : 'ongoing'
}

const mapActivityItem = (item, index) => ({
  id: item?.id ?? `activity-${index}`,
  title: item?.name ?? '未命名活動',
  status: getActivityStatus(item?.end_at),
  redeemedCount: Number(item?.user_redeem_count) || 0,
  period: formatPeriod(item?.start_at, item?.end_at),
  points: Number(item?.user_points) || 0,
  image: fallbackImages[index % fallbackImages.length],
})

const resolveLineUserId = (params = {}) =>
  params.line_user_id || window.endpoint?.lineUserId || window.endpoint?.testUserId || ''

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [],
    loading: false,
    errorMessage: '',
    pagination: {
      currentPage: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
  }),
  actions: {
    setActivitiesFromApi(result = {}) {
      const rows = Array.isArray(result?.data) ? result.data : []
      this.activities = rows.map(mapActivityItem)
      this.pagination = {
        currentPage: Number(result?.current_page) || 1,
        perPage: Number(result?.per_page) || rows.length || 10,
        total: Number(result?.total) || rows.length,
        lastPage: Number(result?.last_page) || 1,
      }
    },
    async fetchActivities(params = {}) {
      this.loading = true
      this.errorMessage = ''

      try {
        const lineUserId = resolveLineUserId(params)

        const response = await pointActivityService.getPointActivities({
          page: 1,
          per_page: 10,
          line_user_id: lineUserId,
          ...params,
        })

        this.setActivitiesFromApi(response?.result ?? {})
      } catch (error) {
        this.activities = []
        this.pagination = {
          currentPage: 1,
          perPage: 10,
          total: 0,
          lastPage: 1,
        }
        this.errorMessage = error?.response?.message || error?.message || '取得集點活動列表失敗'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
