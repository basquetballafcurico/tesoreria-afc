const estadoLabel = {
  bueno: 'Bueno',
  regular: 'Regular',
  malo: 'Malo',
  perdido: 'Perdido',
};

const estadoClass = {
  bueno: 'badge-pagado',
  regular: 'badge-descuento',
  malo: 'badge-pendiente',
  perdido: 'badge-parcial',
};

export default function InventoryTable({ items }) {
  if (!items.length) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Todavía no hay artículos cargados.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table>
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Categoría</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.nombre}</td>
              <td>{i.categoria}</td>
              <td>{i.cantidad}</td>
              <td>
                <span className={`badge ${estadoClass[i.estado] || 'badge-pendiente'}`}>
                  {estadoLabel[i.estado] || i.estado}
                </span>
              </td>
              <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{i.notas || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
