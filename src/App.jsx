import { useState, useEffect, lazy, Suspense } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import { readGunIdFromUrl, syncGunIdToUrl } from './utils/shareLink.js'
import './App.css'

// Lazy-loaded views — split into separate chunks, fetched on first visit.
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))

function PageLoader() {
  return (
    <div className="state-box">
      <Loader size={28} className="spin" />
      <p>Loading…</p>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'editProfile'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving, setArchiving] = useState(false)
  const [linkError, setLinkError] = useState('')

  // Open a shared product link (?gun=<id>) on first load
  useEffect(() => {
    const sharedId = readGunIdFromUrl()
    if (!sharedId) return
    gunService
      .getGunById(sharedId)
      .then((res) => {
        if (res.success && res.data) {
          setSelectedGun(res.data)
          setMode('detail')
        }
      })
      .catch(() => {
        syncGunIdToUrl(null)
        setLinkError('Shared product could not be found.')
        setTimeout(() => setLinkError(''), 4000)
      })
  }, [])

  // Keep the address bar in sync with the open product
  useEffect(() => {
    syncGunIdToUrl(mode === 'detail' ? selectedGun?.id : null)
  }, [mode, selectedGun])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
    } else if (target === 'EditProfile') {
      setMode('editProfile')
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        <Suspense fallback={<PageLoader />}>
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'detail' && selectedGun && (
            <GunDetail
              key={selectedGun.id}
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setArchiveTarget(g)}
            />
          )}

          {mode === 'editProfile' && (
            <EditProfilePage
              onBack={() => handleNavigate('Profile')}
              onSaved={() => handleNavigate('Profile')}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Cart' && (
                <CartPage onNavigateCatalog={() => setTab('Catalog')} />
              )}
              {tab === 'Profile' && (
                <ProfilePage
                  onReplaySplash={() => setShowSplash(true)}
                  onEditProfile={() => handleNavigate('EditProfile')}
                  onOpenDraft={(id) =>
                    id === 'create' ? handleNavigate('Create') : handleNavigate('Edit', { id })
                  }
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Global Archive (soft delete) Confirmation */}
      <ConfirmModal
        open={Boolean(archiveTarget)}
        title="Archive Hardware Record"
        message={`Move "${archiveTarget?.name}" to the archive? You can restore or permanently delete it from Catalog → Archive.`}
        confirmLabel="Archive"
        danger
        loading={archiving}
        onConfirm={async () => {
          if (!archiveTarget) return
          try {
            setArchiving(true)
            await gunService.archiveGun(archiveTarget.id)
            setArchiveTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to archive record.')
          } finally {
            setArchiving(false)
          }
        }}
        onCancel={() => setArchiveTarget(null)}
      />

      {linkError && <div className="toast toast--error">{linkError}</div>}

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
