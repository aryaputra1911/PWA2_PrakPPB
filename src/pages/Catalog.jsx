import { useState, useMemo } from 'react'
import {
  RefreshCw,
  Plus,
  Loader,
  AlertCircle,
  PackageOpen,
  Archive,
  ArchiveRestore,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import AdvancedFilter from '../components/common/AdvancedFilter'
import Pagination from '../components/common/Pagination'
import ConfirmModal from '../components/modals/ConfirmModal'
import gunService from '../services/gunService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
  formatPrice,
} from '../utils/helpers'

const PAGE_SIZE = 6

/**
 * Catalog page — the main product listing.
 *
 * Data source priority:
 *   1. Live API via useGuns()
 *   2. Local static array (GUNS_LOCAL) when the API is unreachable
 *
 * Features: search, category filter, sort, pagination, archive (soft delete)
 * with restore / permanent delete.
 */
export default function Catalog({ onNavigate }) {
  // ---- API data ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 200 })
  const {
    guns: archivedGuns,
    loading: archivedLoading,
    refetch: refetchArchived,
  } = useGuns({ limit: 200, archived: true })
  const [useLocal, setUseLocal] = useState(false)
  const [view, setView] = useState('active') // 'active' | 'archived'

  // Decide data source
  const rawGuns = useMemo(() => {
    if (useLocal || (error && apiGuns.length === 0)) {
      // Enrich local data with synthetic ids so FavoriteButton and detail work
      return GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    }
    return apiGuns
  }, [apiGuns, error, useLocal])

  // ---- filters / sort / pagination ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)

  const categories = useMemo(() => extractCategories(rawGuns), [rawGuns])

  const filteredGuns = useMemo(() => {
    let result = rawGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, search, activeCategory, sortKey, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredGuns.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedGuns = filteredGuns.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const handlePageChange = (n) => {
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const refreshAll = () => {
    refetch()
    refetchArchived()
  }

  // ---- archive / restore / permanent delete ----
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const runAction = async (fn) => {
    try {
      setBusy(true)
      setActionError('')
      await fn()
      refreshAll()
    } catch (err) {
      setActionError(err.message || 'Action failed.')
      setTimeout(() => setActionError(''), 4000)
    } finally {
      setBusy(false)
    }
  }

  const handleArchive = () =>
    runAction(async () => {
      await gunService.archiveGun(archiveTarget.id)
      setArchiveTarget(null)
    })

  const handleRestore = (gun) => runAction(() => gunService.restoreGun(gun.id))

  const handleDeletePermanent = () =>
    runAction(async () => {
      await gunService.deleteGun(deleteTarget.id)
      setDeleteTarget(null)
    })

  // ---- Archive view ----
  if (view === 'archived') {
    return (
      <>
        <section className="masthead">
          <button type="button" className="detail-back" onClick={() => setView('active')}>
            <ArrowLeft size={18} /> Back to Catalog
          </button>
          <h1 className="display">Archive</h1>
          <p className="lede">
            Archived pieces are hidden from the catalog. Restore them or delete them permanently.
          </p>
        </section>

        <section>
          <div className="list-head">
            <h2>Archived stock</h2>
            <span className="count">
              {archivedGuns.length} piece{archivedGuns.length !== 1 ? 's' : ''}
            </span>
          </div>

          {archivedLoading && (
            <div className="state-box">
              <Loader size={28} className="spin" />
              <p>Loading archive…</p>
            </div>
          )}

          {!archivedLoading && archivedGuns.length === 0 && (
            <div className="state-box">
              <Archive size={28} />
              <p>The archive is empty.</p>
            </div>
          )}

          {archivedGuns.length > 0 && (
            <ul className="draft-list">
              {archivedGuns.map((gun) => (
                <li key={gun.id} className="draft-item">
                  <img className="cart-img" src={gun.image_url} alt={gun.name} loading="lazy" />
                  <div className="draft-info">
                    <span className="name display">{gun.name}</span>
                    <span className="type">
                      {gun.type} · {formatPrice(gun.price)} · archived{' '}
                      {new Date(gun.archived_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="draft-actions">
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handleRestore(gun)}
                      disabled={busy}
                    >
                      <ArchiveRestore size={14} /> Restore
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => setDeleteTarget(gun)}
                      disabled={busy}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ConfirmModal
          open={!!deleteTarget}
          title="Delete Permanently"
          message={`Permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={busy}
          onConfirm={handleDeletePermanent}
          onCancel={() => setDeleteTarget(null)}
        />
        {actionError && <div className="toast toast--error">{actionError}</div>}
      </>
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      <section>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} piece{filteredGuns.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setView('archived')}
            >
              <Archive size={16} /> Archive ({archivedGuns.length})
            </button>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1) }}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={(c) => { setActiveCategory(c); setPage(1) }}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order); setPage(1) }}
        />

        {/* States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {/* Product grid */}
        {pagedGuns.length > 0 && (
          <ul className="stock">
            {pagedGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={(g) => onNavigate && onNavigate('Detail', g)}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={setArchiveTarget}
              />
            ))}
          </ul>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onChange={handlePageChange} />
        {filteredGuns.length > 0 && (
          <p className="page-info">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredGuns.length)} of {filteredGuns.length}
          </p>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* Archive confirmation */}
      <ConfirmModal
        open={!!archiveTarget}
        title="Archive Product"
        message={`Move "${archiveTarget?.name}" to the archive? You can restore it later.`}
        confirmLabel="Archive"
        danger
        loading={busy}
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />
      {actionError && <div className="toast toast--error">{actionError}</div>}
    </>
  )
}
