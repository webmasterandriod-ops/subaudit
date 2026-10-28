/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  Scissors,
  CalendarClock,
  Layers,
  Settings as SettingsIcon,
  Plus,
  CheckCircle2,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  ActiveTab,
  AppSettings,
  Subscription,
} from './types';
import {
  USAGE_LABELS,
  calculateLedgerTotals,
  formatMoney,
  formatRenewalCountdown,
  getAuditMetrics,
  getCategoryBreakdown,
  getMonthlyEquivalent,
  getRenewalGroups,
  getStitchAuditShowcaseDataset,
  getStitchDefaultDataset,
} from './utils/ledger';
import { HomeScreen } from './components/HomeScreen';
import { AuditScreen } from './components/AuditScreen';
import { RenewalsScreen } from './components/RenewalsScreen';
import { CategoriesScreen } from './components/CategoriesScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SubscriptionFormModal } from './components/SubscriptionFormModal';
import { LedgerSkeleton } from './components/LedgerSkeleton';
import { TactileReceiptIcon } from './components/TactileReceiptIcon';

const STORAGE_KEY_SUBS = 'com.kstudio.subaudit.subscriptions.v1';
const STORAGE_KEY_SETTINGS = 'com.kstudio.subaudit.settings.v1';

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  reminderDays: 3,
};

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'audit', label: 'Audit', icon: Scissors },
  { id: 'renewals', label: 'Renewals', icon: CalendarClock },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fall back to default Stitch dataset
    }
    return getStitchDefaultDataset();
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved !== null) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fall back to default settings
    }
    return DEFAULT_SETTINGS;
  });

  // Modal state for Screen 2 (Add) and Screen 3 (Detail & Edit)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  // Success toast feedback state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initial local loading transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  // Persist subscriptions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(subscriptions));
    } catch {
      // Ignore quota errors in restricted storage
    }
  }, [subscriptions]);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore storage error
    }
  }, [settings]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
  };

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleOpenAdd = () => {
    setSelectedSub(null);
    setModalMode('add');
  };

  const handleOpenEdit = (sub: Subscription) => {
    setSelectedSub(sub);
    setModalMode('edit');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedSub(null);
  };

  const handleSaveSubscription = (
    subData: Omit<Subscription, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === existingId ? { ...item, ...subData } : item
        )
      );
      showNotification(`Saved changes to "${subData.name}".`);
    } else {
      const newSub: Subscription = {
        ...subData,
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setSubscriptions((prev) => [newSub, ...prev]);
      showNotification(`Recorded "${subData.name}" in your local ledger.`);
    }
    handleCloseModal();
  };

  const handleDeleteSubscription = (id: string) => {
    const target = subscriptions.find((s) => s.id === id);
    setSubscriptions((prev) => prev.filter((item) => item.id !== id));
    handleCloseModal();
    if (target) {
      const monthly = getMonthlyEquivalent(target.cost, target.cycle);
      showNotification(
        `Removed "${target.name}" (${formatMoney(monthly, settings.currency)}/mo).`
      );
    }
  };

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleClearAll = () => {
    setSubscriptions([]);
    setActiveTab('home');
    showNotification('Cleared all subscriptions. Showing first-run empty state.');
  };

  const handleRestoreDefaultSample = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSubscriptions(getStitchDefaultDataset());
      setIsLoading(false);
      showNotification('Restored Stitch design sample ($142.50/mo).');
    }, 180);
  };

  const handleRestoreAuditSample = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSubscriptions(getStitchAuditShowcaseDataset());
      setIsLoading(false);
      showNotification('Loaded Adobe Creative Cloud audit showcase.');
    }, 180);
  };

  const handleTriggerLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showNotification('Local ledger reloaded.');
    }, 550);
  };

  // Live metrics for desktop companion sidebar
  const { monthlyTotal, yearlyTotal, activeCount } =
    calculateLedgerTotals(subscriptions);
  const { wasteCandidates, recoverableMonthly, recoverableYearly } =
    getAuditMetrics(subscriptions);
  const { next7Days, next7DaysTotal } = getRenewalGroups(subscriptions);
  const categoryStats = getCategoryBreakdown(subscriptions);

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F8FAFC] flex flex-col pb-20 lg:pb-12">
      {/* Top Bar following strict 3-zone contract */}
      <header className="sticky top-0 z-30 h-14 bg-[#090A0F]/90 backdrop-blur-md border-b border-[#1E2433]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('home');
            }}
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            SubAudit
          </a>

          {/* Zone 2: 5 single-line text nav links (visible on desktop) */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#94A3B8]"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-white border-[#10F596]'
                      : 'text-[#94A3B8] border-transparent hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#10F596] text-[#090A0F] font-display text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Record Subscription</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        id="top"
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-8"
      >
        {/* Success Banner Notification */}
        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 p-3.5 sm:px-4 rounded-[16px] bg-[#12151E] border border-[#10F596]/50 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 text-sm text-white">
              <CheckCircle2 className="w-4 h-4 text-[#10F596] shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss notification"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Primary Interactive Screen Column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Screen Context Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {activeTab === 'home' && 'Tactile Ledger'}
                  {activeTab === 'audit' && 'Cancel Candidates'}
                  {activeTab === 'renewals' && 'Upcoming Renewals'}
                  {activeTab === 'categories' && 'Spend by Category'}
                  {activeTab === 'settings' && 'Ledger Settings'}
                </h1>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {activeTab === 'home' &&
                    'Local-only recurring spend auditor · No account or bank link required'}
                  {activeTab === 'audit' &&
                    'Ranked by cost against usage rating — rarely and never-used on top'}
                  {activeTab === 'renewals' &&
                    'Charges scheduled in the next 7 days and next 30 days'}
                  {activeTab === 'categories' &&
                    'Monthly totals and share breakdown across all 5 categories'}
                  {activeTab === 'settings' &&
                    'Currency, reminder window, CSV/JSON export, and local reset'}
                </p>
              </div>
            </div>

            {isLoading ? (
              <LedgerSkeleton />
            ) : (
              <>
                {activeTab === 'home' && (
                  <HomeScreen
                    subscriptions={subscriptions}
                    currency={settings.currency}
                    reminderDays={settings.reminderDays}
                    onAddClick={handleOpenAdd}
                    onSelectSubscription={handleOpenEdit}
                    onNavigateTab={setActiveTab}
                    onLoadDefaultSample={handleRestoreDefaultSample}
                  />
                )}

                {activeTab === 'audit' && (
                  <AuditScreen
                    subscriptions={subscriptions}
                    currency={settings.currency}
                    onSelectSubscription={handleOpenEdit}
                    onQuickCancelSubscription={handleDeleteSubscription}
                    onLoadAuditPreset={handleRestoreAuditSample}
                    onLoadDefaultPreset={handleRestoreDefaultSample}
                  />
                )}

                {activeTab === 'renewals' && (
                  <RenewalsScreen
                    subscriptions={subscriptions}
                    currency={settings.currency}
                    reminderDays={settings.reminderDays}
                    onSelectSubscription={handleOpenEdit}
                    onAddClick={handleOpenAdd}
                  />
                )}

                {activeTab === 'categories' && (
                  <CategoriesScreen
                    subscriptions={subscriptions}
                    currency={settings.currency}
                    onSelectSubscription={handleOpenEdit}
                    onAddClick={handleOpenAdd}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsScreen
                    settings={settings}
                    subscriptions={subscriptions}
                    onUpdateSettings={handleUpdateSettings}
                    onClearAll={handleClearAll}
                    onRestoreDefaultSample={handleRestoreDefaultSample}
                    onRestoreAuditSample={handleRestoreAuditSample}
                    onTriggerLoadingDemo={handleTriggerLoadingDemo}
                    onNotify={showNotification}
                  />
                )}
              </>
            )}
          </div>

          {/* Desktop Companion Column: Live Ledger Audit Inspector */}
          <aside
            aria-label="Live ledger snapshot"
            className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-5 sticky top-20"
          >
            {/* Receipt Ticket Snapshot */}
            <div className="bg-[#12151E] border border-[#1E2433] rounded-[20px] overflow-hidden">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#94A3B8]">Ledger Snapshot</p>
                    <h2 className="font-display text-base font-bold text-white mt-0.5">
                      SubAudit Receipt
                    </h2>
                  </div>
                  <TactileReceiptIcon size={36} />
                </div>

                <div className="pt-3 border-t border-[#1E2433] space-y-2.5 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[#94A3B8]">Monthly Total</span>
                    <span className="font-mono-num font-bold text-[#10F596]">
                      {formatMoney(monthlyTotal, settings.currency)}/mo
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[#94A3B8]">Yearly Total</span>
                    <span className="font-mono-num font-semibold text-[#10F596]">
                      {formatMoney(yearlyTotal, settings.currency)}/yr
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[#94A3B8]">Recoverable Waste</span>
                    <span className="font-mono-num font-semibold text-[#10F596]">
                      {formatMoney(recoverableMonthly, settings.currency, true)}/mo
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[#94A3B8]">Due Next 7 Days</span>
                    <span className="font-mono-num font-semibold text-[#10F596]">
                      {formatMoney(next7DaysTotal, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* Top Cancel Candidate Quick Card */}
                {wasteCandidates.length > 0 && (
                  <div className="pt-3 border-t border-[#1E2433]">
                    <div className="flex items-center justify-between text-xs text-[#FFD06A] mb-1.5">
                      <span>#1 Cancel Candidate</span>
                      <span>
                        {USAGE_LABELS[wasteCandidates[0].usage]} used
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(wasteCandidates[0])}
                      className="w-full p-3 rounded-[14px] bg-[#1A1F2C] hover:bg-[#232A3B] text-left transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-white truncate">
                          {wasteCandidates[0].name}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          Save{' '}
                          {formatMoney(
                            recoverableYearly,
                            settings.currency,
                            true
                          )}
                          /yr total waste
                        </p>
                      </div>
                      <span className="font-mono-num text-sm font-bold text-[#10F596] shrink-0">
                        {formatMoney(
                          getMonthlyEquivalent(
                            wasteCandidates[0].cost,
                            wasteCandidates[0].cycle
                          ),
                          settings.currency,
                          true
                        )}
                        /mo
                      </span>
                    </button>
                  </div>
                )}

                {/* Category Mini Shares */}
                {activeCount > 0 && (
                  <div className="pt-3 border-t border-[#1E2433] space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>Category Shares</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('categories')}
                        className="text-[#10F596] hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>View all</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {categoryStats
                        .filter((c) => c.monthlyTotal > 0)
                        .map((cat) => (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-[#F8FAFC]">{cat.label}</span>
                            <span className="font-mono-num text-[#94A3B8]">
                              <span className="text-[#10F596] font-medium">
                                {formatMoney(cat.monthlyTotal, settings.currency)}
                              </span>{' '}
                              ({cat.sharePercent.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Next 7 Days Mini List */}
                {next7Days.length > 0 && (
                  <div className="pt-3 border-t border-[#1E2433] space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>Renewing in 7 Days</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('renewals')}
                        className="text-[#10F596] hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Schedule</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {next7Days.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="w-full text-left flex items-center justify-between text-xs py-1 hover:text-[#10F596] transition-colors"
                        >
                          <span className="truncate pr-2 text-white">
                            {item.name}{' '}
                            <span className="text-[#FFD06A]">
                              ({formatRenewalCountdown(item.renewalDate)})
                            </span>
                          </span>
                          <span className="font-mono-num text-[#10F596] shrink-0">
                            {formatMoney(
                              getMonthlyEquivalent(item.cost, item.cycle),
                              settings.currency
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-2 w-full receipt-notch opacity-70" />
            </div>
          </aside>
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar across the 5 screens (Mobile & Tablet) */}
      <nav
        aria-label="Bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#090A0F]/95 backdrop-blur-md border-t border-[#1E2433] lg:hidden"
      >
        <div className="max-w-lg mx-auto h-full grid grid-cols-5 items-center px-2">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-[#10F596]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-[11px] font-medium tracking-tight mt-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Screen 2 & Screen 3 Modal: Add Subscription / Subscription Detail & Edit */}
      {modalMode && (
        <SubscriptionFormModal
          mode={modalMode}
          initialSubscription={selectedSub}
          currency={settings.currency}
          onSave={handleSaveSubscription}
          onDelete={handleDeleteSubscription}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
