import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '../src/css/globals.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/model/AuthProvider.tsx'
import Spinner from './views/spinner/Spinner.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Suspense fallback={<Spinner />}>
        <App />
      </Suspense>
    </AuthProvider>
  </QueryClientProvider>
)
