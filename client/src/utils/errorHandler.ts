// client/src/utils/errorHandler.ts
import { AxiosError } from "axios";

export const getErrorMessage = (err: unknown, defaultMessage: string = "Произошла ошибка"): string => {
  if (err instanceof AxiosError) {
    // Ошибка axios
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    return data?.detail || data?.message || data?.error || err.message || defaultMessage;
  }
  
  if (err instanceof Error) {
    return err.message;
  }
  
  if (typeof err === 'string') {
    return err;
  }
  
  return defaultMessage;
};