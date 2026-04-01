import { z } from 'zod'

export const registerStartupSchema = z.object({
  startupName: z.string().min(2, 'Минимум 2 символа'),
  fullName: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  sector: z.string().min(1, 'Выберите отрасль'),
})

export const registerInvestorSchema = z.object({
  fullName: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  companyName: z.string().min(2, 'Укажите ИП / ООО'),
  ogrn: z.string().min(5, 'Укажите ОГРНИП / ОГРН'),
})

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export type RegisterStartupInput = z.infer<typeof registerStartupSchema>
export type RegisterInvestorInput = z.infer<typeof registerInvestorSchema>
export type LoginInput = z.infer<typeof loginSchema>
