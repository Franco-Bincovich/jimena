import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'

const PedirFactura = lazy(() => import('./pages/PedirFactura'))
const EnviarFactura = lazy(() => import('./pages/EnviarFactura'))
const Proveedores = lazy(() => import('./pages/Proveedores'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Plantillas = lazy(() => import('./pages/Plantillas'))
const Facturas = lazy(() => import('./pages/Facturas'))
const Historial = lazy(() => import('./pages/Historial'))
const Configuracion = lazy(() => import('./pages/Configuracion'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-40">
      <span className="text-muted text-sm">Cargando...</span>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/pedir-factura" replace />} />
            <Route path="/pedir-factura" element={<PedirFactura />} />
            <Route path="/enviar-factura" element={<EnviarFactura />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/plantillas" element={<Plantillas />} />
            <Route path="/facturas" element={<Facturas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}
