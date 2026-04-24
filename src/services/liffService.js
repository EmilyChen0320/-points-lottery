const endpoint = window.endpoint ?? {}

const getEnvConfig = () => {
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  return {
    liffId: endpoint.liffId ?? '',
    basicId: endpoint.basicId ?? '',
    enableLiff: endpoint.enableLiff !== false,
    testUserId: endpoint.testUserId ?? 'U_TEST_USER_001',
    debug: Boolean(endpoint.debug),
    isLocalhost,
  }
}

const isLiffRuntimeAvailable = () => typeof window !== 'undefined' && typeof window.liff !== 'undefined'

const init = async () => {
  const env = getEnvConfig()
  const shouldUseTestMode = !env.enableLiff || env.isLocalhost

  if (shouldUseTestMode || !isLiffRuntimeAvailable()) {
    return { initialized: false, testMode: true, env }
  }

  if (!env.liffId) {
    throw new Error('LIFF ID 未設定，請檢查 window.endpoint.liffId')
  }

  await window.liff.init({ liffId: env.liffId })
  return { initialized: true, testMode: false, env }
}

const isLoggedIn = () => (isLiffRuntimeAvailable() ? window.liff.isLoggedIn() : false)

const login = () => {
  if (isLiffRuntimeAvailable() && !window.liff.isLoggedIn()) {
    window.liff.login({ redirectUri: window.location.href })
  }
}

const logout = () => {
  if (isLiffRuntimeAvailable() && window.liff.isLoggedIn()) {
    window.liff.logout()
  }
}

const getUserId = async (fallbackUserId = '') => {
  if (!isLiffRuntimeAvailable()) return fallbackUserId

  const context = window.liff.getContext()
  if (context?.userId) return context.userId

  const idToken = window.liff.getDecodedIDToken()
  return idToken?.sub ?? fallbackUserId
}

const getProfile = async () => {
  if (!isLiffRuntimeAvailable() || !window.liff.isLoggedIn()) return null
  return window.liff.getProfile()
}

const getFriendship = async () => {
  if (!isLiffRuntimeAvailable() || !window.liff.isLoggedIn()) return { friendFlag: false }
  return window.liff.getFriendship()
}

const isInClient = () => (isLiffRuntimeAvailable() ? window.liff.isInClient() : false)

const sendImageMessage = async (imageUrl, previewImageUrl = imageUrl) => {
  if (!isLiffRuntimeAvailable() || !window.liff.isInClient() || !window.liff.isLoggedIn()) return false

  await window.liff.sendMessages([
    {
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl,
    },
  ])
  return true
}

const getEnvironment = () => getEnvConfig()

export default {
  init,
  login,
  logout,
  isLoggedIn,
  isInClient,
  getUserId,
  getProfile,
  getFriendship,
  sendImageMessage,
  getEnvironment,
}
