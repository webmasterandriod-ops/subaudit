import React, { useState } from 'react';
import { ChevronRight, Layers, Plus } from 'lucide-react';
import { CategoryId, CurrencyCode, Subscription } from '../types';
import {
  USAGE_LABELS,
  calculateLedgerTotals,
  formatDisplayDate,
  formatMoney,
  getCategoryBreakdown,
  getMonthlyEquivalent,
} from '../utils/ledger';

interface CategoriesScreenProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onSelectSubscription: (sub: Subscription) => void;
  onAddClick: () => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  subscriptions,
  currency,
  onSelectSubscription,
  onAddClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(
    'all'
  );

  const { monthlyTotal, yearlyTotal } = calculateLedgerTotals(subscriptions);
  const categoryStats = getCategoryBreakdown(subscriptions);
  const isEmpty = subscriptions.length === 0;

  const filteredStat =
    selectedCategory === 'all'
      ? null
      : categoryStats.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Spend Summary Header */}
      <section
        aria-label="Category spend overview"
        className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#94A3B8]">
              Total Categorized Monthly Spend
            </p>
            <div className="mt-2">
              <span
                data-testid="categories-monthly-total"
                className="money-display text-4xl font-bold text-[#10F596]"
              >
                {`${formatMoney(monthlyTotal, currency)}/mo`}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-[#94A3B8]">Annualized Total</p>
            <p className="money-display text-lg font-bold text-[#10F596] mt-1">
              {`${formatMoney(yearlyTotal, currency)}/yr`}
            </p>
          </div>
        </div>

        {/* Stacked Proportional Distribution Bar using slate tonal steps */}
        {!isEmpty && (
          <div className="mt-5 space-y-2">
            <div
              className="h-3 w-full rounded-full bg-[#090A0F] overflow-hidden flex gap-0.5 p-0.5 border border-[#1E2433]"
              aria-hidden="true"
            >
              {categoryStats
                .filter((c) => c.sharePercent > 0)
                .map((cat, idx) => {
                  const slateTones = [
                    'bg-[#CBD5E1]',
                    'bg-[#94A3B8]',
                    'bg-[#64748B]',
                    'bg-[#475569]',
                    'bg-[#334155]',
                  ];
                  return (
                    <div
                      key={cat.id}
                      style={{ width: `${Math.max(cat.sharePercent, 3)}%` }}
                      className={`h-full first:rounded-l-full last:rounded-r-full ${slateTones[idx % slateTones.length]}`}
                    />
                  );
                })}
            </div>
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span>5 categories</span>
            </div>
          </div>
        )}
      </section>

      {isEmpty ? (
        <section
          aria-label="Empty categories state"
          className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-8 text-center space-y-4"
        >
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1A1F2C] border border-[#262D40] flex items-center justify-center text-[#94A3B8]">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-display text-lg font-bold text-white">
              No Category Spend Recorded
            </h2>
            <p className="text-sm text-[#94A3B8]">
              Add a subscription in Fitness, Streaming, Apps, Music, or Other to
              see category totals and share percentages.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onAddClick}
              className="min-h-[48px] px-5 rounded-[16px] bg-[#1A1F2C] hover:bg-[#242B3D] border border-[#2E364B] text-white text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Subscription</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Category Breakdown List */}
          <section aria-label="Totals per category with shares" className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-base font-semibold text-white">
                Category Breakdown
              </h2>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-[#94A3B8] hover:text-white hover:underline whitespace-nowrap"
                >
                  Show all categories
                </button>
              )}
            </div>

            <div className="bg-[#12151E] border border-[#1E2433] rounded-[20px] divide-y divide-[#1E2433] overflow-hidden">
              {categoryStats.map((stat) => {
                const isSelected = selectedCategory === stat.id;
                return (
                  <div key={stat.id} className="transition-colors">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategory(isSelected ? 'all' : stat.id)
                      }
                      className={`w-full min-h-[68px] p-4 sm:px-5 text-left hover:bg-[#1A1F2C]/70 transition-colors flex flex-col justify-center gap-2 ${
                        isSelected ? 'bg-[#1A1F2C]/90' : ''
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3 w-full">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-display text-base font-semibold text-white">
                            {stat.label}
                          </span>
                          <span className="text-xs text-[#94A3B8]">
                            · {stat.count}{' '}
                            {stat.count === 1 ? 'subscription' : 'subscriptions'}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2.5 shrink-0">
                          <span className="money-display text-base font-bold text-[#10F596]">
                            {formatMoney(stat.monthlyTotal, currency)}
                          </span>
                          <span className="font-mono-num text-xs text-[#94A3B8] w-14 text-right">
                            ({stat.sharePercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      {/* Share Progress Bar in Slate */}
                      <div className="w-full h-1.5 bg-[#090A0F] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${stat.sharePercent}%` }}
                          className="h-full bg-[#94A3B8] rounded-full transition-all"
                        />
                      </div>
                    </button>

                    {/* Drilldown items if selected */}
                    {isSelected && stat.items.length > 0 && (
                      <div className="bg-[#090A0F]/70 border-t border-[#1E2433] divide-y divide-[#1E2433]/60 px-3 py-1">
                        {stat.items.map((sub) => {
                          const monthly = getMonthlyEquivalent(
                            sub.cost,
                            sub.cycle
                          );
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => onSelectSubscription(sub)}
                              className="w-full min-h-[54px] px-3 py-2.5 text-left hover:bg-[#1A1F2C]/60 rounded-xl transition-colors flex items-center justify-between gap-3 group"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {sub.name}
                                </p>
                                <p className="text-xs text-[#94A3B8]">
                                  Renews {formatDisplayDate(sub.renewalDate)} ·{' '}
                                  {USAGE_LABELS[sub.usage]} use
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="money-display text-sm font-semibold text-[#10F596]">
                                  {`${formatMoney(monthly, currency)}/mo`}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#64748B]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {filteredStat && filteredStat.items.length === 0 && (
            <div className="bg-[#12151E] border border-[#1E2433] rounded-[18px] p-5 text-center text-sm text-[#94A3B8]">
              No active subscriptions in {filteredStat.label}.
            </div>
          )}
        </>
      )}
    </div>
  );
};
