import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Holdings from './pages/Holdings.jsx';
import Watchlist from './pages/Watchlist.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/holdings" element={<Holdings />} />
        <Route path="/watchlist" element={<Watchlist />} />
      </Routes>
    </Layout>
  );
}
