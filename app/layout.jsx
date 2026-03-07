import { Playfair_Display, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { UserProvider } from '@/context/userContext'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Sala Rosa | Espaço de Beleza e Bem-estar',
  description: 'Sala Rosa – seu espaço exclusivo de beleza, bem-estar e cuidado pessoal.',
  generator: 'Sala Rosa',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-body antialiased bg-background text-foreground">
        <UserProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'toast-rosa',
              },
            }}
          />
        </UserProvider>
      </body>
    </html>
  )
}
