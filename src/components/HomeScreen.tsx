import React from 'react';
import {
  Plus,
  ChevronRight,
  CalendarClock,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import {
  ActiveTab,
  CurrencyCode,
  ReminderWindow,
  Subscription,
} from '../types';
import {
  CATEGORY_LABELS,
  USAGE_LABELS,
  calculateLedgerTotals,
  formatDisplayDate,
  formatMoney,
  formatRenewalCountdown,
  getAnnualEquivalent,
  getAuditMetrics,
  getDaysUntilRenewal,
  getMonthlyEquivalent,
  getRenewalGroups,
} from '../utils/ledger';
import { TactileReceiptIcon } from './TactileReceiptIcon';

interface HomeScreenProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  reminderDays: ReminderWindow;
  onAddClick: () => void;
  onSelectSubscription: (sub: Subscription) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onLoadDefaultSample: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  subscriptions,
  currency,
  reminderDays,
  onAddClick,
  onSelectSubscription,
  onNavigateTab,
  onLoadDefaultSample,
}) => {
  const { monthlyTotal, yearlyTotal, activeCount } =
    calculateLedgerTotals(subscriptions);
  const { sortedAll } = getRenewalGroups(subscriptions);
  const { wasteCandidates, recoverableMonthly, recoverableYearly } =
    getAuditMetrics(subscriptions);

  const isEmpty = subscriptions.length === 0;

  return (
    <div className="space-y-6">
      {/* Monthly & Yearly Total Hero Receipt Card */}
      <section
        aria-label="Recurring spend summary"
        className="bg-[#12151E] border border-[#1E2433] rounded-[20px] overflow-hidden"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#94A3B8]">
                Monthly Recurring Total
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  data-testid="hero-monthly-total"
                  className="font-mono-num text-4xl sm:text-5xl font-bold tracking-tight text-[#10F596]"
                >
                  {formatMoney(monthlyTotal, currency)}
                </span>
                <span className="font-mono-num text-base text-[#94A3B8]">
                  /mo
                </span>
              </div>
            </div>
            <TactileReceiptIcon size={42} className="shrink-0" />
          </div>

          {/* Yearly Total & Active Subscription Count */}
          <div className="mt-5 pt-4 border-t border-[#1E2433] flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <span>Yearly commitment:</span>
              <span
                data-testid="hero-yearly-total"
                className="font-mono-num font-semibold text-[#10F596]"
              >
                {formatMoney(yearlyTotal, currency)}/yr
              </span>
            </div>

            <div className="text-[#94A3B8] font-mono-num">
              <span className="text-white font-semibold">{activeCount}</span>{' '}
              <span>active</span>
              {wasteCandidates.length > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('audit')}
                    className="text-[#FFD06A] hover:underline whitespace-nowrap"
                  >
                    {wasteCandidates.length} to audit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Primary Action Button: + Record Subscription */}
          <div className="mt-5">
            <button
              type="button"
              onClick={onAddClick}
              className="w-full min-h-[54px] px-5 rounded-[16px] bg-[#10F596] text-[#090A0F] font-display font-semibold text-base flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>+ Record Subscription</span>
            </button>
          </div>
        </div>

        {/* Subtle Receipt Torn Bottom Edge */}
        <div className="h-2 w-full receipt-notch opacity-70" />
      </section>

      {/* Screen 8: First-Run Empty State */}
      {isEmpty ? (
        <section
          aria-label="First-run empty state"
          className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-6 sm:p-8 text-center space-y-4"
        >
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1A1F2C] border border-[#262D40] flex items-center justify-center">
            <TactileReceiptIcon size={32} />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-display text-lg font-semibold text-white">
              Your local ledger is empty
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Track your recurring spend locally in under 60 seconds — tap
              &lsquo;+&rsquo; to add your first subscription.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddClick}
              className="w-full sm:w-auto min-h-[48px] px-5 rounded-[16px] bg-[#1A1F2C] hover:bg-[#232A3B] border border-[#2E364B] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-[#10F596]" />
              <span>Add First Subscription</span>
            </button>
            <button
              type="button"
              onClick={onLoadDefaultSample}
              className="w-full sm:w-auto min-h-[48px] px-4 rounded-[16px] text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#1A1F2C] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Design Sample ($142.50/mo)</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Recoverable Savings Callout Banner (if Never/Rarely used subscriptions exist) */}
          {wasteCandidates.length > 0 && (
            <div className="bg-[#12151E] border border-[#1E2433] rounded-[18px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#FFD06A] font-medium">
                  Cancel Candidates Detected · {wasteCandidates.length} rarely or
                  never used
                </p>
                <p className="text-sm text-[#F8FAFC] mt-1">
                  Potential monthly savings:{' '}
                  <span className="font-mono-num font-bold text-[#10F596]">
                    {formatMoney(recoverableMonthly, currency, true)}/mo
                  </span>{' '}
                  <span className="text-[#94A3B8]">
                    ({formatMoney(recoverableYearly, currency, true)}/yr)
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="min-h-[48px] px-4 rounded-[14px] bg-[#1A1F2C] hover:bg-[#242B3D] border border-[#2B3348] text-sm font-medium text-white flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Review Audit</span>
                <ArrowUpRight className="w-4 h-4 text-[#10F596]" />
              </button>
            </div>
          )}

          {/* Next Renewals & Active Ledger List */}
          <section aria-label="Next renewals list" className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-display text-base font-semibold text-white">
                  Next Renewals
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Tap any subscription to view detail, edit, or delete
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('renewals')}
                className="min-h-[44px] px-2 text-xs font-medium text-[#94A3B8] hover:text-white flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <span>7d &amp; 30d schedule</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#12151E] border border-[#1E2433] rounded-[20px] divide-y divide-[#1E2433] overflow-hidden">
              {sortedAll.map((sub) => {
                const monthly = getMonthlyEquivalent(sub.cost, sub.cycle);
                const yearly = getAnnualEquivalent(sub.cost, sub.cycle);
                const days = getDaysUntilRenewal(sub.renewalDate);
                const isWithinReminder = days >= 0 && days <= reminderDays;
                const isWaste =
                  sub.usage === 'never' || sub.usage === 'rarely';

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSelectSubscription(sub)}
                    className="w-full min-h-[68px] p-4 sm:px-5 text-left hover:bg-[#1A1F2C]/80 active:bg-[#1A1F2C] transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-semibold text-white truncate group-hover:text-[#10F596] transition-colors">
                          {sub.name}
                        </span>
                      </div>

                      {/* Unboxed clean metadata with typographic separators */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#94A3B8]">
                        <span>{CATEGORY_LABELS[sub.category]}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            isWithinReminder
                              ? 'text-[#FFD06A] font-medium'
                              : 'text-[#94A3B8]'
                          }
                        >
                          <CalendarClock className="w-3 h-3 inline mr-1 -mt-0.5" />
                          {formatRenewalCountdown(sub.renewalDate)} (
                          {formatDisplayDate(sub.renewalDate)})
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            isWaste ? 'text-[#FFD06A]' : 'text-[#94A3B8]'
                          }
                        >
                          {USAGE_LABELS[sub.usage]} use
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono-num text-base font-semibold text-[#10F596]">
                          {formatMoney(monthly, currency)}
                          <span className="text-xs font-normal text-[#94A3B8]">
                            /mo
                          </span>
                        </div>
                        <div className="font-mono-num text-[11px] text-[#94A3B8]">
                          {sub.cycle === 'annual'
                            ? `${formatMoney(sub.cost, currency)}/yr billed`
                            : `${formatMoney(yearly, currency)}/yr`}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
