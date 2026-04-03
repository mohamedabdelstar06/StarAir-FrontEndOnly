import axios from 'axios'

const api = axios.create({
    baseURL: 'https://starair.runasp.net',
})

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Handle 401 — attempt token refresh, otherwise redirect to login
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config

        // Don't intercept 401s for login/check-email endpoints so components can handle them and show errors!
        if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login') && !original.url?.includes('/auth/check-email')) {
            original._retry = true
            const refreshToken = localStorage.getItem('refreshToken')
            const accessToken = localStorage.getItem('accessToken')

            if (refreshToken && accessToken) {
                try {
                    const { data } = await axios.post(
                        'https://starair.runasp.net/api/auth/refresh-token',
                        { accessToken, refreshToken }
                    )
                    localStorage.setItem('accessToken', data.accessToken)
                    localStorage.setItem('refreshToken', data.refreshToken)
                    original.headers.Authorization = `Bearer ${data.accessToken}`
                    return api(original)
                } catch {
                    localStorage.clear()
                    window.location.href = '/login'
                }
            } else {
                localStorage.clear()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api
