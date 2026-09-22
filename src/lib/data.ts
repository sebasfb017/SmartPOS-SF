export const getEmployees = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('employees');
    if (stored) return JSON.parse(stored);
    
    const defaults = [
      { id: 1, name: 'Carlos Mendoza', role: 'Cajero', status: 'Trabajando', lastShift: 'Hoy, 08:00 AM', cedula: '1098765432' },
      { id: 2, name: 'Ana Ramírez', role: 'Cajero', status: 'Descanso', lastShift: 'Ayer, 04:00 PM', cedula: '1023456789' },
      { id: 3, name: 'Luis Pérez', role: 'Cocinero', status: 'Trabajando', lastShift: 'Hoy, 07:00 AM', cedula: '1122334455' },
    ];
    localStorage.setItem('employees', JSON.stringify(defaults));
    return defaults;
  }
  return [];
};

export const getProducts = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('products');
    if (stored) return JSON.parse(stored);
    
    const defaults = [
      { id: 1, name: 'Café Americano', price: 5000, stock: 50, category: 'Bebidas', business: 'restaurante' },
      { id: 2, name: 'Empanada de Carne', price: 3500, stock: 30, category: 'Comida', business: 'restaurante' },
      { id: 3, name: 'Plato del Día', price: 15000, stock: 20, category: 'Comida', business: 'restaurante' },
      { id: 4, name: 'Sándwich de Jamón', price: 7000, stock: 15, category: 'Comida', business: 'restaurante' },
      { id: 5, name: 'Papas Fritas Bolsa', price: 2500, stock: 40, category: 'Snacks', business: 'tienda' },
      { id: 6, name: 'Gaseosa Cola', price: 3000, stock: 60, category: 'Bebidas', business: 'tienda' },
      { id: 7, name: 'Agua Mineral', price: 2000, stock: 100, category: 'Bebidas', business: 'tienda' },
      { id: 8, name: 'Galletas de Chocolate', price: 1500, stock: 80, category: 'Snacks', business: 'tienda' },
    ];
    localStorage.setItem('products', JSON.stringify(defaults));
    return defaults;
  }
  return [];
};

export const saveProducts = (products: any[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('products', JSON.stringify(products));
    window.dispatchEvent(new Event('productsChange'));
  }
};

export const getSales = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sales');
    if (stored) return JSON.parse(stored);
    return [];
  }
  return [];
};

export const saveSales = (sales: any[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sales', JSON.stringify(sales));
    window.dispatchEvent(new Event('salesChange'));
  }
};
