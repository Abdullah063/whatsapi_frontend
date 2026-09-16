import { ApiError } from './http';

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      INVALID_CREDENTIALS: 'E-posta veya parola hatalı.',
      ACCOUNT_NOT_ACTIVE: 'Hesabınız henüz aktif değil.',
      LOGIN_RATE_LIMIT_EXCEEDED: 'Çok fazla başarısız deneme yapıldı. Lütfen daha sonra tekrar deneyin.',
      AUTHENTICATION_REQUIRED: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
      ACCESS_DENIED: 'Bu işlem için yetkiniz bulunmuyor.',
    };
    const validationMessage = error.problem.violations?.[0]?.message;
    return (error.problem.code && messages[error.problem.code])
      || validationMessage
      || error.problem.detail
      || error.problem.title
      || `İşlem tamamlanamadı (${error.status}).`;
  }
  return error instanceof Error && error.message
    ? `Sunucuya ulaşılamadı: ${error.message}`
    : 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
}
