import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CommandHeader from './CommandHeader';
import InstitutionalFooter from './InstitutionalFooter';
import QuickAuditModal from './QuickAuditModal';

export default function AppShell() {
  const [isQuickAuditOpen, setIsQuickAuditOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickAuditOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F4F6F8] text-[#0A2540] antialiased font-sans selection:bg-[#0A2540] selection:text-white">
      {/* Top Institutional Command Bar */}
      <CommandHeader onOpenQuickAudit={() => setIsQuickAuditOpen(true)} />

      {/* Main Forensic Canvas */}
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>

      {/* Institutional Treasury Footer */}
      <InstitutionalFooter />

      {/* ⌘K / Ctrl+K Quick Audit Command Palette */}
      <QuickAuditModal
        isOpen={isQuickAuditOpen}
        onClose={() => setIsQuickAuditOpen(false)}
      />
    </div>
  );
}
