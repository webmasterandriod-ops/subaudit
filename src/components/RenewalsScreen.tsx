import React from 'react';
import {
  BellRing,
  CalendarCheck2,
  CalendarClock,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { CurrencyCode, ReminderWindow, Subscription } from '../types';
import {
  CATEGORY_LABELS,
  USAGE_LABELS,
  formatDisplayDate,
  formatMoney,
  formatRenewalCountdown,
  getDaysUntilRenewal,
  getMonthlyEquivalent,
  getRenewalGroups,
} from '../utils/ledger';

interface RenewalsScreenProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  reminderDays: ReminderWindow;
  onSelectSubscription: (sub: Subscription) => void;
  onAddClick: () => void;
}

export const RenewalsScreen: React.FC<RenewalsScreenProps> = ({
  subscriptions,
  currency,
  reminderDays,
  onSelectSubscription,
  onAddClick,
}) => {
  const {
    next7Days,
    next7DaysTotal,
    next8To30Days,
    next8To30DaysTotal,
    allNext30Days,
    sortedAll,
  } = getRenewalGroups(subscriptions);

  const laterSubscriptions = sortedAll.filter(
    (s) => getDaysUntilRenewal(s.renewalDate) > 30
  );

  const hasAnyUpcoming30 = allNext30Days.length > 0;

  return (
    <div className="space-y-6">
      {/* No-Renewals Empty State */}
      {!hasAnyUpcoming30 ? (
        <section
          aria-label="No upcoming renewals empty state"
          className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-8 text-center space-y-4"
        >
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1A1F2C] border border-[#262D40] flex items-center justify-center text-[#94A3B8]">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-display text-lg font-bold text-white">
              No Renewals in the Next 30 Days
            </h2>
            <p className="money-display text-sm text-[#10F596]">
              {`${formatMoney(0, currency)} due in 30 days`}
            </p>
            <p className="text-sm text-[#94A3B8] pt-1">
              {subscriptions.length === 0
                ? 'Your local ledger has no active subscriptions scheduled.'
                : 'All active subscriptions renew more than 30 days from today.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onAddClick}
              className="min-h-[48px] px-5 rounded-[16px] bg-[#1A1F2C] hover:bg-[#242B3D] border border-[#2E364B] text-white text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Record Subscription</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Group 1: Next 7 Days */}
          <section aria-label="Renewals in next 7 days" className="space-y-3">
            <div className="px-1">
              <h2 className="font-display text-base font-semibold text-white flex flex-wrap items-baseline gap-1.5">
                <span>
                  {`Next 7 Days - ${next7Days.length} ${
                    next7Days.length === 1 ? 'charge' : 'charges'
                  } - `}
                </span>
                <span
                  data-testid="renewals-7d-total"
                  className="money-display font-bold text-[#10F596]"
                >
                  {formatMoney(next7DaysTotal, currency)}
                </span>
              </h2>
            </div>

            {next7Days.length === 0 ? (
              <div className="bg-[#12151E] border border-[#1E2433] rounded-[18px] p-5 text-center text-sm text-[#94A3B8]">
                No charges scheduled in the next 7 days (
                <span className="money-display text-[#10F596]">
                  {formatMoney(0, currency)}
                </span>
                ).
              </div>
            ) : (
              <div className="bg-[#12151E] border border-[#1E2433] rounded-[20px] divide-y divide-[#1E2433] overflow-hidden">
                {next7Days.map((sub) => {
                  const monthly = getMonthlyEquivalent(sub.cost, sub.cycle);
                  const days = getDaysUntilRenewal(sub.renewalDate);
                  const isAlert = days >= 0 && days <= reminderDays;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => onSelectSubscription(sub)}
                      className="w-full min-h-[68px] p-4 sm:px-5 text-left hover:bg-[#1A1F2C]/80 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-semibold text-white truncate">
                            {sub.name}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#94A3B8]">
                          <span className="text-[#FFD06A] font-medium">
                            {isAlert ? (
                              <BellRing className="w-3 h-3 inline mr-1 -mt-0.5" />
                            ) : (
                              <CalendarClock className="w-3 h-3 inline mr-1 -mt-0.5" />
                            )}
                            {formatRenewalCountdown(sub.renewalDate)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatDisplayDate(sub.renewalDate)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{CATEGORY_LABELS[sub.category]}</span>
                          <span aria-hidden="true">·</span>
                          <span>{USAGE_LABELS[sub.usage]} use</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="money-display text-base font-semibold text-[#10F596]">
                            {`${formatMoney(monthly, currency)}/mo`}
                          </div>
                          <div className="font-mono-num text-[11px] text-[#94A3B8]">
                            {sub.cycle === 'annual'
                              ? `${formatMoney(sub.cost, currency)} annual`
                              : 'Monthly billing'}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Group 2: Days 8-30 */}
          <section aria-label="Renewals in days 8 to 30" className="space-y-3">
            <div className="px-1">
              <h2 className="font-display text-base font-semibold text-white flex flex-wrap items-baseline gap-1.5">
                <span>
                  {`Days 8-30 - ${next8To30Days.length} ${
                    next8To30Days.length === 1 ? 'charge' : 'charges'
                  } - `}
                </span>
                <span
                  data-testid="renewals-30d-total"
                  className="money-display font-bold text-[#10F596]"
                >
                  {formatMoney(next8To30DaysTotal, currency)}
                </span>
              </h2>
            </div>

            {next8To30Days.length === 0 ? (
              <div className="bg-[#12151E] border border-[#1E2433] rounded-[18px] p-5 text-center text-sm text-[#94A3B8]">
                No additional renewals between days 8 and 30.
              </div>
            ) : (
              <div className="bg-[#12151E] border border-[#1E2433] rounded-[20px] divide-y divide-[#1E2433] overflow-hidden">
                {next8To30Days.map((sub) => {
                  const monthly = getMonthlyEquivalent(sub.cost, sub.cycle);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => onSelectSubscription(sub)}
                      className="w-full min-h-[68px] p-4 sm:px-5 text-left hover:bg-[#1A1F2C]/80 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-display text-base font-semibold text-white truncate block">
                          {sub.name}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#94A3B8]">
                          <span>{formatRenewalCountdown(sub.renewalDate)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatDisplayDate(sub.renewalDate)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{CATEGORY_LABELS[sub.category]}</span>
                          <span aria-hidden="true">·</span>
                          <span>{USAGE_LABELS[sub.usage]} use</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="money-display text-base font-semibold text-[#10F596]">
                            {`${formatMoney(monthly, currency)}/mo`}
                          </div>
                          <div className="font-mono-num text-[11px] text-[#94A3B8]">
                            {sub.cycle === 'annual'
                              ? `${formatMoney(sub.cost, currency)} annual`
                              : 'Monthly billing'}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Later Renewals (> 30 Days) if any */}
      {laterSubscriptions.length > 0 && (
        <section aria-label="Renewals beyond 30 days" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-semibold text-[#94A3B8]">
              Beyond 30 Days ({laterSubscriptions.length})
            </h2>
          </div>
          <div className="bg-[#12151E] border border-[#1E2433] rounded-[20px] divide-y divide-[#1E2433] overflow-hidden">
            {laterSubscriptions.map((sub) => {
              const monthly = getMonthlyEquivalent(sub.cost, sub.cycle);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectSubscription(sub)}
                  className="w-full min-h-[64px] p-4 sm:px-5 text-left hover:bg-[#1A1F2C]/80 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-display text-sm font-semibold text-white truncate block">
                      {sub.name}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#94A3B8]">
                      <span>{formatRenewalCountdown(sub.renewalDate)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDisplayDate(sub.renewalDate)}</span>
                    </div>
                  </div>
                  <div className="money-display text-sm font-semibold text-[#10F596]">
                    {`${formatMoney(monthly, currency)}/mo`}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
