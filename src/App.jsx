import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import WorkPage from './pages/WorkPage'
import InquiryPage from './pages/InquiryPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index path="/" element={<WorkPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/contact" element={<InquiryPage />} />
      </Route>
    </Routes>
  )
}
