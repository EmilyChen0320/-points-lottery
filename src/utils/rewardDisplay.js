export const hasRewardItems = (items) => Array.isArray(items) && items.length > 0

export const isPointsPrize = (prize) => {
  const prizeType = String(prize?.type ?? prize?.prize_type ?? '').toLowerCase()
  return prizeType === 'points'
}

export const formatDrawPrizeTitle = (prize) => {
  if (!prize || typeof prize !== 'object') return ''

  const title = String(prize.name || prize.content || '').trim()
  if (!title || !isPointsPrize(prize) || title.endsWith('點')) return title

  return `${title} 點`
}
