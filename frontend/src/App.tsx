import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CreateCoinPage from './pages/CreateCoinPage'
import CreateProjectPage from './pages/CreateProjectPage'
import CreateAuctionPage from './pages/CreateAuctionPage'
import AuctionListPage from './pages/AuctionListPage'
import AuctionDetailPage from './pages/AuctionDetailPage'
import EnhancedAuctionDetailPage from './pages/EnhancedAuctionDetailPage'
import AuctionHistoryPage from './pages/AuctionHistoryPage'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="create-coin" element={<CreateCoinPage />} />
          <Route path="create-project" element={<CreateProjectPage />} />
          <Route path="create-auction" element={<CreateAuctionPage />} />
          <Route path="auctions" element={<AuctionListPage />} />
          <Route path="auction/:id" element={<EnhancedAuctionDetailPage />} />
          <Route path="history" element={<AuctionHistoryPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
