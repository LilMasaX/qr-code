'use client';

import { useState } from 'react';
import TicketGenerator from '@/components/TicketGenerator';
import QRScanner from '@/components/QRScanner';
import AdminDashboard from '@/components/AdminDashboard';

type TabType = 'dashboard' | 'generate' | 'scan';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: '📊' },
    { id: 'generate' as TabType, label: 'Generar Entradas', icon: '🎫' },
    { id: 'scan' as TabType, label: 'Validar Entradas', icon: '📱' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black">QR Event Manager</h1>
            </div>
            <div className="text-sm text-black">
              Sistema de gestión de entradas con QR
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-black-500 hover:text-black-700 hover:border-black-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'generate' && <TicketGenerator />}
        {activeTab === 'scan' && <QRScanner />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-black-500">
            <p>QR Event Manager - Sistema de gestión de entradas</p>
            <p className="mt-1">Desarrollado por LilMasaX (https://github.com/LilMasaX)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
