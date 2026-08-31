export const ErrorCode = Object.freeze({
  LOTTERY_NO_AVAILABLE_PRIZE: 'LOTTERY_NO_AVAILABLE_PRIZE',
  LOTTERY_NOT_CONFIGURED: 'LOTTERY_NOT_CONFIGURED',
})

/**
 * 抽獎分類 code 對應的結果標題。
 * 這兩種情境重送不會改變結果，結果頁不提供重試入口。
 */
export const getTerminalLotteryErrorTitle = (code) => {
  if (code === ErrorCode.LOTTERY_NO_AVAILABLE_PRIZE) return '獎品已抽完'
  if (code === ErrorCode.LOTTERY_NOT_CONFIGURED) return '活動準備中'
  return ''
}
