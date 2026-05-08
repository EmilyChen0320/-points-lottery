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

const parsePoints = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const mapActivityItem = (item, index, baseIndex = 0) => ({
  id: item?.id ?? `activity-${baseIndex + index}`,
  title: item?.name ?? '未命名活動',
  status: getActivityStatus(item?.end_at),
  redeemedCount: parsePoints(item?.user_redeem_count),
  period: formatPeriod(item?.start_at, item?.end_at),
  points: parsePoints(item?.user_points),
  image: fallbackImages[(baseIndex + index) % fallbackImages.length],
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
    setActivitiesFromApi(result = {}, { append = false } = {}) {
      const rows = Array.isArray(result?.data) ? result.data : []
      const baseIndex = append ? this.activities.length : 0
      const mappedRows = rows.map((item, index) => mapActivityItem(item, index, baseIndex))
      this.activities = append ? [...this.activities, ...mappedRows] : mappedRows
      this.pagination = {
        currentPage: parsePoints(result?.current_page) || 1,
        perPage: parsePoints(result?.per_page) || rows.length || 10,
        total: parsePoints(result?.total) || rows.length,
        lastPage: parsePoints(result?.last_page) || 1,
      }
    },
    async refreshActivityPoints(lineUserId, activityIds = []) {
      if (!lineUserId || this.activities.length === 0) return
      const targetActivities =
        activityIds.length > 0
          ? this.activities.filter((item) => activityIds.includes(item.id))
          : this.activities
      if (targetActivities.length === 0) return

      const pointsResults = await Promise.all(
        targetActivities.map(async (item) => {
          if (!item?.id) return { id: item?.id, points: item?.points ?? 0 }

          try {
            const response = await pointActivityService.getLineUserPoints(item.id, {
              line_user_id: lineUserId,
            })
            const latestPoints = parsePoints(response?.result?.data?.points)
            return { id: item.id, points: latestPoints }
          } catch (error) {
            console.error(`取得活動 ${item.id} 最新點數失敗:`, error)
            return { id: item.id, points: item?.points ?? 0 }
          }
        }),
      )

      const pointsMap = new Map(pointsResults.map((entry) => [entry.id, entry.points]))
      this.activities = this.activities.map((item) => ({
        ...item,
        points: pointsMap.get(item.id) ?? item.points,
      }))
    },
    async fetchActivities(params = {}) {
      this.loading = true
      this.errorMessage = ''

      try {
        const { append = false, ...requestParams } = params
        const lineUserId = resolveLineUserId(requestParams)
        const nextPage = append ? this.pagination.currentPage + 1 : 1

        const response = await pointActivityService.getPointActivities({
          page: nextPage,
          per_page: 10,
          line_user_id: lineUserId,
          ...requestParams,
        })

        const rows = Array.isArray(response?.result?.data) ? response.result.data : []
        this.setActivitiesFromApi(response?.result ?? {}, { append })
        await this.refreshActivityPoints(
          lineUserId,
          rows.map((item) => item?.id).filter(Boolean),
        )
      } catch (error) {
        if (!params.append) {
          this.activities = []
          this.pagination = {
            currentPage: 1,
            perPage: 10,
            total: 0,
            lastPage: 1,
          }
        }
        this.errorMessage = error?.response?.message || error?.message || '取得集點活動列表失敗'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
