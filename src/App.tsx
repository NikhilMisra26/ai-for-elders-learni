import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { CoursesPage } from './components/CoursesPage'
import { DashboardPage } from './components/DashboardPage'
import { AccountPage } from './components/AccountPage'
import { AuthForm } from './components/AuthForm'
import { Dialog, DialogContent } from './components/ui/dialog'
import { Toaster } from './components/ui/sonner'

type Page = 'home' | 'courses' | 'dashboard' | 'account'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  const handleAuthClick = () => {
    setShowAuthDialog(true)
  }

  const handleAuthClose = () => {
    setShowAuthDialog(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
      case 'courses':
        return <CoursesPage onAuthClick={handleAuthClick} />
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'account':
        return <AccountPage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
      default:
        return <HomePage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
    }
  }

  return (
    <AuthProvider>
      <AccessibilityProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header 
            onAuthClick={handleAuthClick}
            onNavigate={handleNavigate}
            currentPage={currentPage}
          />
          
          <main>
            {renderPage()}
          </main>

          <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
            <DialogContent className="sm:max-w-md">
              <AuthForm onClose={handleAuthClose} />
            </DialogContent>
          </Dialog>

          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                fontSize: '16px',
                padding: '16px',
              },
            }}
          />
        </div>
      </AccessibilityProvider>
    </AuthProvider>
  )
}

export default App