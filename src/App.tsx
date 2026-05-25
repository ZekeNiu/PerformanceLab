import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Comparison from './pages/Comparison'
import Correlation from './pages/Correlation'
import DataEntry from './pages/DataEntry'
import Admin from './pages/Admin'
import Settings from './pages/Settings'
import { WorkspaceProvider } from './lib/workspace-store'

export default function App() {
  return (
    <WorkspaceProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/correlation" element={<Correlation />} />
          <Route path="/data-entry" element={<DataEntry />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </WorkspaceProvider>
  )
}
