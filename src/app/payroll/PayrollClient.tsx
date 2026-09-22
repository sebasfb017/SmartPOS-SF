'use client';
import { useState, useEffect } from 'react';

const mockEmployees = [
  { id: 1, name: 'Carlos Mendoza', role: 'Cajero', status: 'Trabajando', lastShift: 'Hoy, 08:00 AM', cedula: '1098765432' },
  { id: 2, name: 'Ana Ramírez', role: 'Cajero', status: 'Descanso', lastShift: 'Ayer, 04:00 PM', cedula: '1023456789' },
  { id: 3, name: 'Luis Pérez', role: 'Cocinero', status: 'Trabajando', lastShift: 'Hoy, 07:00 AM', cedula: '1122334455' },
];

export default function PayrollClient() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', cedula: '', role: '' });

  useEffect(() => {
    const stored = localStorage.getItem('employees');
    if (stored) {
      setEmployees(JSON.parse(stored));
    } else {
      setEmployees(mockEmployees);
      localStorage.setItem('employees', JSON.stringify(mockEmployees));
    }
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      localStorage.setItem('employees', JSON.stringify(employees));
    }
  }, [employees]);

  const toggleStatus = (id: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        return { ...emp, status: emp.status === 'Trabajando' ? 'Terminó Turno' : 'Trabajando' };
      }
      return emp;
    }));
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: '', cedula: '', role: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingId(emp.id);
    setFormData({ name: emp.name, cedula: emp.cedula, role: emp.role });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.cedula && formData.role) {
      if (editingId) {
        // Edit mode
        setEmployees(prev => prev.map(emp => 
          emp.id === editingId ? { ...emp, name: formData.name, cedula: formData.cedula, role: formData.role } : emp
        ));
      } else {
        // Create mode
        setEmployees(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            name: formData.name, 
            cedula: formData.cedula,
            role: formData.role, 
            status: 'Descanso', 
            lastShift: 'Nuevo ingreso' 
          }
        ]);
      }
      setShowModal(false);
      setFormData({ name: '', cedula: '', role: '' }); // Reset
      setEditingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem' }}>Personal del Negocio</h2>
        <button className="btn-primary" onClick={handleOpenNew}>
          + Nuevo Empleado
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {employees.map(emp => (
          <div key={emp.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-dark-secondary)', position: 'relative' }}>
            
            {/* Actions Menu (Edit/Delete) */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => handleOpenEdit(emp)}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}
                title="Editar empleado"
              >
                ✏️ Editar
              </button>
              <button 
                onClick={() => handleDelete(emp.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }}
                title="Eliminar empleado"
              >
                🗑️ Eliminar
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {emp.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{emp.role} • CC: {emp.cedula}</div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
               <span style={{ color: 'var(--text-muted)' }}>Último turno: {emp.lastShift}</span>
               <span style={{ 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem',
                  background: emp.status === 'Trabajando' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: emp.status === 'Trabajando' ? 'var(--success)' : 'var(--text-muted)'
                }}>
                  {emp.status}
                </span>
            </div>
            
            <button 
              onClick={() => toggleStatus(emp.id)}
              style={{ 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid var(--border-glass)', 
                background: 'transparent', 
                color: 'var(--text-main)', 
                cursor: 'pointer',
                marginTop: 'auto'
              }}
            >
              {emp.status === 'Trabajando' ? 'Finalizar Turno' : 'Iniciar Turno'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ background: 'var(--bg-dark)', padding: '2rem', width: '400px', borderRadius: '16px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              {editingId ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
            </h3>
            
            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white' }}
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Número de Cédula</label>
                <input 
                  type="text" 
                  required
                  value={formData.cedula}
                  onChange={e => setFormData({...formData, cedula: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white' }}
                  placeholder="Ej. 1090123456"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargo o Puesto</label>
                <input 
                  type="text" 
                  required
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white' }}
                  placeholder="Ej. Cajero, Mesero..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingId(null); }}
                  style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Guardar Cambios' : 'Guardar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
