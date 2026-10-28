import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { CurrencyCode, Subscription } from '../types';
import {
  CATEGORY_LABELS,
  USAGE_LABELS,
  formatMoney,
  getAnnualEquivalent,
  getAuditMetrics,
  getMonthlyEquivalent,
} from '../utils/ledger';

interface AuditScreenProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onSelectSubscription: (sub: Subscription) => void;
  onQuickCancelSubscription: (id: string) => void;
}

export const AuditScreen: React.FC<AuditScreenProps> = ({
  subscriptions,
  currency,
  onSelectSubscription,
  onQuickCancelSubscription,
}) => {
  const [filterMode, setFilterMode] = useState<'waste' | 'all'>('waste');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const { allRanked, wasteCandidates, recoverableMonthly, recoverableYearly } =
    getAuditMetrics(subscriptions);

  const displayedList = filterMode === 'waste' ? wasteCandidates : allRanked;
  const hasZeroWaste = wasteCandidates.length === 0;

  return (
    <div className="space-y-6">
      {/* Recoverable Total Hero Card */}
      <section
        aria-label="Recoverable savings summary"
        className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#94A3B8]">
              Recoverable Monthly Savings (Never &amp; Rarely Used)
            </p>
            <div className="mt-2">
              <span
                data-testid="audit-recoverable-monthly"
                className="money-display text-4xl sm:text-5xl font-bold text-[#10F596]"
              >
                {`${formatMoney(recoverableMonthly, currency, true)}/mo`}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-[#94A3B8]">Annualized Recovery</p>
            <p
              data-testid="audit-recoverable-yearly"
              className="money-display text-xl font-bold text-[#10F596] mt-1"
            >
              {`${formatMoney(recoverableYearly, currency, true)}/yr`}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Filter Segmented Control + Short Caption */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          role="group"
          aria-label="Filter cancel candidates"
          className="inline-flex items-center gap-1 p-1 bg-[#12151E] border border-[#1E2433] rounded-[16px]"
        >
          <button
            type="button"
            onClick={() => setFilterMode('waste')}
            className={`min-h-[44px] px-4 rounded-[12px] text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'waste'
                ? 'bg-[#1A1F2C] text-white border border-[#2D3548]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Cancel Candidates ({wasteCandidates.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`min-h-[44px] px-4 rounded-[12px] text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'all'
                ? 'bg-[#1A1F2C] text-white border border-[#2D3548]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            All Ranked ({allRanked.length})
          </button>
        </div>

        <span className="text-xs text-[#94A3B8] flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Sorted by: Inactive &amp; Cost</span>
        </span>
      </div>

      {/* All Clean / Zero Waste Empty State */}
      {filterMode === 'waste' && hasZeroWaste ? (
        <section
          aria-label="Zero waste empty state"
          className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-8 text-center space-y-4"
        >
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1A1F2C] border border-[#262D40] flex items-center justify-center text-[#94A3B8]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-display text-lg font-bold text-white">
              All Clean — Zero Waste
            </h2>
            <p className="money-display text-base font-semibold text-[#10F596]">
              {`${formatMoney(0, currency)}/mo waste`}
            </p>
            <p className="text-sm text-[#94A3B8] pt-1">
              Every active subscription in your ledger is rated Daily or Weekly
              usage. No rarely or never-used subscriptions found.
            </p>
          </div>
          {allRanked.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="min-h-[48px] px-5 rounded-[14px] bg-[#1A1F2C] hover:bg-[#232A3B] border border-[#2D3548] text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0"
              >
                Inspect All {allRanked.length} Subscriptions by Rank
              </button>
            </div>
          )}
        </section>
      ) : displayedList.length === 0 ? (
        <section className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-8 text-center space-y-2">
          <h2 className="font-display text-base font-semibold text-white">
            No subscriptions in ledger
          </h2>
          <p className="text-sm text-[#94A3B8]">
            Add subscriptions on the Home screen to rank them by cost against
            usage.
          </p>
        </section>
      ) : (
        <section
          aria-label="Ranked cancel candidates list"
          className="space-y-3"
        >
          {displayedList.map((sub, index) => {
            const rankNum = index + 1;
            const monthly = getMonthlyEquivalent(sub.cost, sub.cycle);
            const yearly = getAnnualEquivalent(sub.cost, sub.cycle);
            const isConfirming = confirmCancelId === sub.id;
            const isHighWaste =
              sub.usage === 'never' || sub.usage === 'rarely';

            return (
              <div
                key={sub.id}
                className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-4 sm:p-5 transition-colors hover:border-[#2B3348]"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => onSelectSubscription(sub)}
                    className="text-left flex-1 min-w-0 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono-num text-sm font-bold text-[#FFD06A] shrink-0 mt-0.5">
                        #{rankNum}
                      </span>
                      <h3 className="font-display text-base sm:text-lg font-semibold text-white line-clamp-2 break-words leading-snug">
                        {sub.name}
                      </h3>
                    </div>

                    {/* Clean unboxed metadata */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#94A3B8]">
                      <span
                        className={
                          sub.usage === 'never'
                            ? 'text-rose-400 font-semibold'
                            : sub.usage === 'rarely'
                              ? 'text-[#FFD06A] font-semibold'
                              : 'text-[#94A3B8]'
                        }
                      >
                        {USAGE_LABELS[sub.usage]} used
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{CATEGORY_LABELS[sub.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {sub.cycle === 'annual'
                          ? `${formatMoney(sub.cost, currency)}/yr (${formatMoney(monthly, currency)}/mo eq.)`
                          : `${formatMoney(sub.cost, currency)}/mo`}
                      </span>
                    </div>
                  </button>

                  {/* Saving amount stacked neatly on the right */}
                  <div className="text-right shrink-0">
                    <div className="money-display text-lg font-bold text-[#10F596]">
                      {`${formatMoney(monthly, currency, true)}/mo`}
                    </div>
                    <div className="money-display text-xs text-[#10F596]/85 mt-0.5">
                      {`Save ${formatMoney(yearly, currency, true)}/yr`}
                    </div>
                  </div>
                </div>

                {/* Action bar for quick cancel or inspect */}
                <div className="mt-4 pt-3 border-t border-[#1E2433] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#94A3B8]">
                    {isHighWaste ? (
                      <>
                        Cancelling recovers{' '}
                        <span className="money-display text-[#10F596]">
                          {`${formatMoney(monthly, currency, true)}/mo`}
                        </span>
                      </>
                    ) : (
                      `Active ${USAGE_LABELS[sub.usage].toLowerCase()} subscription`
                    )}
                  </span>

                  {!isConfirming ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectSubscription(sub)}
                        className="min-h-[44px] px-3 rounded-[12px] bg-[#1A1F2C] hover:bg-[#242B3D] text-xs font-medium text-[#94A3B8] hover:text-white flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Edit</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(sub.id)}
                        className="min-h-[44px] px-3.5 rounded-[12px] bg-[#1A1F2C] hover:bg-rose-950/40 border border-[#2A3144] hover:border-rose-500/40 text-xs font-medium text-white hover:text-rose-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Mark Cancelled</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(null)}
                        className="min-h-[44px] px-3 rounded-[12px] bg-[#1A1F2C] text-xs font-medium text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap shrink-0"
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onQuickCancelSubscription(sub.id);
                          setConfirmCancelId(null);
                        }}
                        className="min-h-[44px] px-3.5 rounded-[12px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                      >
                        {`Confirm Cancel (${formatMoney(monthly, currency, true)}/mo)`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};
