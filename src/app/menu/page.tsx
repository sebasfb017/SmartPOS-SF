'use client';
import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/data';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  Bebidas:  { icon: '🥤', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)'  },
  Comida:   { icon: '🥪', color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  Snacks:   { icon: '🍿', color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
};

export default function PublicMenuPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    setProducts(getProducts());
    if (typeof window !== 'undefined') {
      setMenuUrl(window.location.href);
    }
  }, []);

  const categories = ['Todos', ...Object.keys(CATEGORY_CONFIG)];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesBusiness = businessFilter === 'all' || p.business === businessFilter;
    const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
    return matchesSearch && matchesBusiness && matchesCategory && p.stock > 0;
  });

  const grouped = categories
    .filter(c => c !== 'Todos')
    .reduce((acc, cat) => {
      const items = filteredProducts.filter(p => p.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    }, {} as Record<string, any[]>);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b35 50%, #071428 100%)',
      color: 'white',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(16,185,129,0.15) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '2.5rem 1.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative blur blobs */}
        <div style={{ position: 'absolute', top: '-60px', left: '20%', width: '200px', height: '200px', background: 'rgba(99,102,241,0.15)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-40px', right: '15%', width: '160px', height: '160px', background: 'rgba(16,185,129,0.12)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))' }}>🍽️</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 900, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
            PARADOR <span style={{ background: 'linear-gradient(90deg, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PRO</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', margin: 0 }}>
            Menú Digital • Actualizado en Tiempo Real
          </p>

          {/* QR Code hint */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            marginTop: '1rem', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '30px',
            padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)'
          }}>
            <span>📲</span>
            <span>Comparte este menú: <strong style={{ color: 'rgba(255,255,255,0.75)' }}>ip:8060/menu</strong></span>
          </div>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '1.5rem 1rem 0' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Buscar en el menú..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.9rem 1rem 0.9rem 3rem',
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: '0.95rem',
              outline: 'none', transition: 'border 0.2s'
            }}
          />
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', opacity: 0.5 }}>🔍</span>
        </div>

        {/* Business tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { key: 'all',         label: '✨ Todo el Menú' },
            { key: 'restaurante', label: '🍽️ Restaurante'  },
            { key: 'tienda',      label: '🏪 Tienda'       },
          ].map(b => (
            <button
              key={b.key}
              onClick={() => setBusinessFilter(b.key)}
              style={{
                padding: '0.65rem 0.5rem', borderRadius: '10px', border: 'none',
                background: businessFilter === b.key
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'transparent',
                color: businessFilter === b.key ? 'white' : 'rgba(255,255,255,0.45)',
                fontWeight: businessFilter === b.key ? 700 : 500,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: businessFilter === b.key ? '0 4px 12px rgba(99,102,241,0.35)' : 'none'
              }}
            >{b.label}</button>
          ))}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          {categories.map(cat => {
            const cfg = cat !== 'Todos' ? CATEGORY_CONFIG[cat] : null;
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '0.5rem 1.1rem', borderRadius: '30px', whiteSpace: 'nowrap',
                  border: `1px solid ${isActive ? (cfg?.color || '#818cf8') : 'rgba(255,255,255,0.1)'}`,
                  background: isActive ? (cfg?.bg || 'rgba(99,102,241,0.2)') : 'transparent',
                  color: isActive ? (cfg?.color || '#818cf8') : 'rgba(255,255,255,0.4)',
                  fontWeight: isActive ? 700 : 500, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {cfg ? `${cfg.icon} ${cat}` : '✨ Todos'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Product List ─────────────────────────────────────── */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1rem 3rem' }}>
        {filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 1rem',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px', color: 'rgba(255,255,255,0.35)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🍽️</div>
            <p style={{ fontSize: '1.05rem' }}>No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          /* Render grouped by category when showing all */
          categoryFilter === 'Todos'
            ? Object.entries(grouped).map(([cat, items]) => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <div key={cat} style={{ marginBottom: '2.5rem' }}>
                    {/* Category heading */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ width: '3px', height: '28px', borderRadius: '3px', background: cfg.color }} />
                      <span style={{ fontSize: '1.5rem' }}>{cfg.icon}</span>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: cfg.color }}>
                        {cat}
                      </h2>
                      <span style={{ marginLeft: 'auto', background: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '20px', border: `1px solid ${cfg.color}40` }}>
                        {items.length} disponibles
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {items.map(p => <ProductCard key={p.id} product={p} cfg={cfg} />)}
                    </div>
                  </div>
                );
              })
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredProducts.map(p => {
                  const cfg = CATEGORY_CONFIG[p.category] || CATEGORY_CONFIG['Comida'];
                  return <ProductCard key={p.id} product={p} cfg={cfg} />;
                })}
              </div>
            )
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
          <p style={{ margin: '0 0 0.25rem' }}>🍽️ <strong>Parador Pro</strong> — Carta Digital</p>
          <p style={{ margin: 0 }}>Precios en COP • Disponibilidad sujeta a cambios</p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, cfg }: { product: any; cfg: { icon: string; color: string; bg: string } }) {
  const isLow = product.stock <= 5;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1.25rem',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '18px', padding: '1.1rem 1.25rem',
      transition: 'all 0.25s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 30px ${cfg.color}15`;
      e.currentTarget.style.borderColor = `${cfg.color}30`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
    }}
    >
      {/* Icon box */}
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
      }}>
        {cfg.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'white', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            {product.business === 'restaurante' ? '🍽️ Restaurante' : '🏪 Tienda'}
          </span>
          {isLow && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fb923c', background: 'rgba(251,146,60,0.12)', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(251,146,60,0.3)' }}>
              ⚡ Últimas unidades
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: cfg.color }}>
          {formatCurrency(product.price)}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>
          ✓ Disponible
        </div>
      </div>
    </div>
  );
}
