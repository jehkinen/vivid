import { apiRequest } from './request'
import type { OpenAiIntegrationStatus } from '@/types/ai'

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
  openAi: OpenAiIntegrationStatus
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
}

export interface SaveOpenAiKeyResponse {
  openAi: OpenAiIntegrationStatus
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

  saveOpenAiKey(apiKey: string) {
    return apiRequest<SaveOpenAiKeyResponse>({
      path: '/api/profile/openai-key',
      method: 'PUT',
      body: { apiKey },
    })
  },

  deleteOpenAiKey() {
    return apiRequest<SaveOpenAiKeyResponse>({
      path: '/api/profile/openai-key',
      method: 'DELETE',
    })
  },
}

