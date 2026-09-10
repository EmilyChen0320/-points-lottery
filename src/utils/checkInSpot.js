const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const normalizeCheckInSpot = (item = {}) => {
  const distance = item.distance_meters ?? item.distance
  const successfulCount = toNumber(item.successful_checkin_count, 0)
  const checkedIn = Boolean(item.checked_in ?? item.is_checked_in ?? false)
  const isWithinRadius = Boolean(item.is_within_radius)
  const canCheckin = item.can_checkin == null ? isWithinRadius && !checkedIn : Boolean(item.can_checkin)

  return {
    ...item,
    id: item.id ?? item.checkin_spot_id ?? item.spot_id,
    name: item.name || '未命名打卡點',
    address: item.address || '',
    image: item.image || item.image_url || '',
    lat: toNumber(item.lat ?? item.latitude, null),
    lng: toNumber(item.lng ?? item.longitude, null),
    radius: toNumber(item.radius_meters ?? item.radius, 100),
    distance: distance == null ? null : Math.round(toNumber(distance, 0)),
    canCheckin,
    isWithinRadius,
    cannotReason: item.cannot_checkin_reason || '',
    checkedIn,
    hasSuccessfulCheckin: successfulCount > 0,
    successfulCount,
    nextAvailableTime: item.next_available_time || '',
  }
}
