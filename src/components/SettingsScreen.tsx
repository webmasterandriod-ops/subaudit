import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  AppSettings,
  CurrencyCode,
  ReminderWindow,
  Subscription,
} from '../types';
import {
  CURRENCY_CONFIG,
  calculateLedgerTotals,
  formatMoney,
  generateCsvContent,
} from '../utils/ledger';

interface SettingsScreenProps {
  settings: AppSettings;
  subscriptions: Subscription[];
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onClearAll: () => void;
  onRestoreDefaultSample: () => void;
  onRestoreAuditSample: () => void;
  onTriggerLoadingDemo: () => void;
  onNotify: (message: string) => void;
}

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
const REMINDER_WINDOWS: { value: ReminderWindow; label: string }[] = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  subscriptions,
  onUpdateSettings,
  onClearAll,
  onRestoreDefaultSample,
  onRestoreAuditSample,
  onTriggerLoadingDemo,
  onNotify,
}) => {
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [demoToolsOpen, setDemoToolsOpen] = useState(false);
  const [exportPreview, setExportPreview] = useState<{
    format: 'CSV' | 'JSON';
    content: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { monthlyTotal, yearlyTotal, activeCount } =
    calculateLedgerTotals(subscriptions);

  const triggerDownload = (
    filename: string,
    content: string,
    mimeType: string
  ) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback preview is always displayed below
    }
  };

  const handleExportCsv = () => {
    const csv = generateCsvContent(subscriptions);
    setExportPreview({ format: 'CSV', content: csv });
    triggerDownload(
      `subaudit-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      'text/csv;charset=utf-8;'
    );
    onNotify('Exported ledger to CSV format.');
  };

  const handleExportJson = () => {
    const payload = {
      appId: 'com.kstudio.subaudit',
      exportedAt: new Date().toISOString(),
      currency: settings.currency,
      reminderDays: settings.reminderDays,
      summary: {
        monthlyTotal,
        yearlyTotal,
        activeCount,
      },
      subscriptions,
    };
    const json = JSON.stringify(payload, null, 2);
    setExportPreview({ format: 'JSON', content: json });
    triggerDownload(
      `subaudit-ledger-${new Date().toISOString().slice(0, 10)}.json`,
      json,
      'application/json'
    );
    onNotify('Exported ledger to JSON format.');
  };

  const handleCopyPreview = async () => {
    if (!exportPreview) return;
    try {
      await navigator.clipboard.writeText(exportPreview.content);
      setCopied(true);
      onNotify(`${exportPreview.format} data copied to clipboard.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('Select text below to copy manually.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Local Privacy Summary Card */}
      <section className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Local Device Ledger
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Stored strictly in local browser storage · No account · No cloud sync
            </p>
          </div>
          <div className="text-right">
            <span className="money-display text-lg font-bold text-[#10F596]">
              {`${formatMoney(monthlyTotal, settings.currency)}/mo`}
            </span>
            <p className="font-mono-num text-xs text-[#94A3B8]">
              {activeCount} active ·{' '}
              <span className="money-display text-[#10F596]">
                {`${formatMoney(yearlyTotal, settings.currency)}/yr`}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Setting 1: Currency Selector (Compact 3-column row with 48px tap targets) */}
      <section
        aria-label="Currency preference"
        className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-5 sm:p-6 space-y-4"
      >
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            Display Currency
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Choose currency symbol for all totals and savings figures
          </p>
        </div>

        <div
          role="group"
          aria-label="Select currency"
          className="grid grid-cols-3 gap-2"
        >
          {CURRENCIES.map((code) => {
            const cfg = CURRENCY_CONFIG[code];
            const active = settings.currency === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  onUpdateSettings({ currency: code });
                  onNotify(`Currency updated to ${cfg.label}.`);
                }}
                className={`min-h-[48px] px-3 rounded-[14px] border text-sm font-medium flex items-center justify-between transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#1A1F2C] border-[#94A3B8] text-white'
                    : 'bg-[#090A0F] border-[#252B3B] text-[#94A3B8] hover:text-white hover:border-[#333B52]'
                }`}
              >
                <span>{code}</span>
                <span className="font-mono-num text-xs text-[#94A3B8]">
                  {cfg.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Setting 2: Reminder Window */}
      <section
        aria-label="Renewal reminder window"
        className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-5 sm:p-6 space-y-4"
      >
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            Renewal Reminder Window
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Highlight upcoming charges within this window before billing
          </p>
        </div>

        <div
          role="group"
          aria-label="Select reminder window"
          className="grid grid-cols-3 gap-2.5"
        >
          {REMINDER_WINDOWS.map((item) => {
            const active = settings.reminderDays === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onUpdateSettings({ reminderDays: item.value });
                  onNotify(`Reminder window set to ${item.label}.`);
                }}
                className={`min-h-[48px] px-4 rounded-[16px] border text-sm font-medium flex items-center justify-center transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#1A1F2C] border-[#94A3B8] text-white'
                    : 'bg-[#090A0F] border-[#252B3B] text-[#94A3B8] hover:text-white hover:border-[#333B52]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Setting 3: Data Export (CSV and JSON) */}
      <section
        aria-label="Data export"
        className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-5 sm:p-6 space-y-4"
      >
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            Data Export
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Download your local subscription ledger in CSV or JSON format
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[52px] px-4 rounded-[16px] bg-[#1A1F2C] hover:bg-[#232A3B] border border-[#2D3548] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#94A3B8]" />
            <span>Export CSV</span>
            <Download className="w-3.5 h-3.5 text-[#94A3B8] ml-1" />
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[52px] px-4 rounded-[16px] bg-[#1A1F2C] hover:bg-[#232A3B] border border-[#2D3548] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <FileJson className="w-4 h-4 text-[#94A3B8]" />
            <span>Export JSON</span>
            <Download className="w-3.5 h-3.5 text-[#94A3B8] ml-1" />
          </button>
        </div>

        {exportPreview && (
          <div className="mt-4 p-4 rounded-[16px] bg-[#090A0F] border border-[#252B3B] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">
                {exportPreview.format} Export Ready ({subscriptions.length}{' '}
                records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="px-2.5 py-1 rounded-lg bg-[#1A1F2C] hover:bg-[#252C3F] text-xs text-white flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportPreview(null)}
                  className="text-xs text-[#94A3B8] hover:text-white px-2 py-1"
                >
                  Close
                </button>
              </div>
            </div>
            <pre className="font-mono-num text-[11px] text-[#94A3B8] overflow-x-auto max-h-44 p-2 rounded bg-[#12151E]">
              {exportPreview.content}
            </pre>
          </div>
        )}
      </section>

      {/* Collapsed Accordion: Demo tools */}
      <section
        aria-label="Demo tools"
        className="bg-[#12151E] border border-[#1E2433] rounded-[20px] overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setDemoToolsOpen((prev) => !prev)}
          aria-expanded={demoToolsOpen}
          className="w-full min-h-[52px] px-5 py-3.5 text-left flex items-center justify-between text-sm font-medium text-[#94A3B8] hover:text-white transition-colors"
        >
          <span className="font-display font-semibold text-white">
            Demo tools
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#94A3B8] transition-transform ${
              demoToolsOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {demoToolsOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-[#1E2433] space-y-3">
            <p className="text-xs text-[#94A3B8]">
              Restore Stitch design sample data or preview the local loading
              skeleton
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={onRestoreDefaultSample}
                className="min-h-[48px] px-3 rounded-[14px] bg-[#090A0F] hover:bg-[#1A1F2C] border border-[#252B3B] text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Baseline ($142.50/mo)</span>
              </button>

              <button
                type="button"
                onClick={onRestoreAuditSample}
                className="min-h-[48px] px-3 rounded-[14px] bg-[#090A0F] hover:bg-[#1A1F2C] border border-[#252B3B] text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Adobe CC Audit Demo</span>
              </button>

              <button
                type="button"
                onClick={onTriggerLoadingDemo}
                className="min-h-[48px] px-3 rounded-[14px] bg-[#090A0F] hover:bg-[#1A1F2C] border border-[#252B3B] text-xs font-medium text-[#94A3B8] hover:text-white flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Skeleton</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Setting 4: Clear-All with Confirm Dialog */}
      <section
        aria-label="Danger zone clear all"
        className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-5 sm:p-6 space-y-4"
      >
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            Reset Local Ledger
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Permanently remove all subscriptions from this device and return to
            the first-run empty state ($0.00/mo).
          </p>
        </div>

        {!confirmClearAll ? (
          <button
            type="button"
            onClick={() => setConfirmClearAll(true)}
            className="w-full min-h-[52px] px-4 rounded-[16px] bg-[#090A0F] hover:bg-rose-950/30 border border-[#252B3B] hover:border-rose-500/50 text-rose-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        ) : (
          <div
            role="alertdialog"
            aria-label="Confirm clear all data"
            className="p-4 rounded-[16px] bg-[#090A0F] border border-rose-500/50 space-y-3"
          >
            <p className="text-sm font-semibold text-white">
              Clear all {activeCount} subscriptions from local storage?
            </p>
            <p className="text-xs text-[#94A3B8]">
              This resets your monthly total to{' '}
              <span className="money-display text-[#10F596]">
                {`${formatMoney(0, settings.currency)}/mo`}
              </span>{' '}
              and shows the first-run empty state.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="min-h-[48px] px-4 rounded-[14px] bg-[#1A1F2C] hover:bg-[#242B3D] text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmClearAll(false);
                }}
                className="min-h-[48px] px-4 rounded-[14px] bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
              >
                Confirm Clear All
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
