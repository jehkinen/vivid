import { apiRequest } from './request'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
}

export interface MeResponse {
  name: string | null
  email: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
}

export const authClient = {
  login(payload: LoginPayload) {
    return apiRequest<LoginResponse>({
      path: '/api/auth/login',
      method: 'POST',
      body: payload,
    })
  },

  me() {
    return apiRequest<MeResponse>({
      path: '/api/auth/me',
    })
  },

  logout() {
    return apiRequest<void>({
      path: '/api/auth/logout',
      method: 'POST',
    })
  },

  changePassword(payload: ChangePasswordPayload) {
    return apiRequest<ChangePasswordResponse>({
      path: '/api/auth/change-password',
      method: 'POST',
      body: payload,
    })
  },
}

