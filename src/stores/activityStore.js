import { defineStore } from 'pinia'

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [
      {
        id: 'mothers-day-001',
        title: '母親節集點送好禮',
        status: 'ongoing',
        redeemedCount: 3,
        period: '04/01 ～ 06/30',
        points: 350,
        note: '集滿 100 點可兌換好禮',
        image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=80',
      },
      {
        id: 'mothers-day-002',
        title: '母親節集點送好禮',
        status: 'ongoing',
        redeemedCount: 3,
        period: '04/01 ～ 06/30',
        points: 350,
        note: '集滿 100 點可兌換好禮',
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80',
      },
      {
        id: 'mothers-day-003',
        title: '母親節集點送好禮',
        status: 'ended',
        redeemedCount: 3,
        period: '04/01 ～ 06/30',
        points: 350,
        note: '集滿 100 點可兌換好禮',
        image: 'https://images.unsplash.com/photo-1493244040629-496f6d136cc3?w=300&q=80',
      },
    ],
  }),
})
