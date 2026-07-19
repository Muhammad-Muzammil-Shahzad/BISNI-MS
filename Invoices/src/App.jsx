import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import InvoiceCreate from './pages/Invoice.create';
import InvoiceRead from './pages/Invoice.read';

const App = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Navigation Sidebar */}
      <Navigation />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/read_invoice" replace />} />
            <Route path="/create_invoice" element={<InvoiceCreate />} />
            <Route path="/read_invoice" element={<InvoiceRead />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;