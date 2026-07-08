import './globals.css';

export const metadata = {
  title: 'Tesorería Club Alianza Francés',
  description: 'Control de ingresos y egresos del club',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
