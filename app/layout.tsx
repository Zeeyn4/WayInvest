import type { Metadata } from "next"
import { Playfair_Display, Jost } from "next/font/google"
import { AppProvider } from "@/components/providers/app-provider"
import { Toast } from "@/components/ui/toast"
import { Modals } from "@/components/modals"
import "./globals.css"

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700", "900"],
})

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: "LamInvest — Первая инвест-платформа регионального рынка",
  description: "LamInvest соединяет перспективные стартапы с верифицированными инвесторами. Безопасные сделки, AI-подбор партнёров, защита от мошенничества.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${playfair.variable} ${jost.variable}`}>
      <body>
        <AppProvider>
          {children}
          <Toast />
          <Modals />
        </AppProvider>
      </body>
    </html>
  )
}
