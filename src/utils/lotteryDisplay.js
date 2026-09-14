export const shouldShowLotteryProbability = (lottery) => {
  const setting = lottery?.show_probability
  return ![false, 0, '0'].includes(setting)
}
