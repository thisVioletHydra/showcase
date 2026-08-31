import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AdminPage } from '#/pages/AdminPage';
import { HomePage } from '#/pages/HomePage';
import { OrderPage } from '#/pages/OrderPage';
import { DebugPanel } from '#/widgets/DebugPanel';

export function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename || undefined}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <DebugPanel />
    </BrowserRouter>
  );
}
