import { toast as sonnerToast } from "sonner"

// Реэкспортируем toast из sonner
export const toast = sonnerToast

// Типы для совместимости с предыдущим API
export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  duration?: number
}

// Для обратной совместимости с предыдущим API
export const useToast = () => {
  return {
    toast: (props: ToastProps) => {
      const { title, description, variant, duration } = props

      // Определяем тип toast в зависимости от варианта
      if (variant === "destructive") {
        return sonnerToast.error(title, {
          description,
          duration,
        })
      } else if (variant === "success") {
        return sonnerToast.success(title, {
          description,
          duration,
        })
      } else {
        return sonnerToast(title, {
          description,
          duration,
        })
      }
    },
  }
}
