import { ApiError } from './http';

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const validationMessage = error.problem.violations?.[0]?.message;
    return validationMessage || error.problem.detail || 'İşlem tamamlanamadı.';
  }
  return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
}
