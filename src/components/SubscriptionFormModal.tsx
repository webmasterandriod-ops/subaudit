import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';
import {
  BillingCycle,
  CategoryId,
  CurrencyCode,
  Subscription,
  UsageRating,
} from '../types';
import {
  CATEGORIES,
  CURRENCY_CONFIG,
  USAGE_LABELS,
  formatDisplayDate,
  formatMoney,
  formatRenewalCountdown,
  getAnnualEquivalent,
  getDaysUntilRenewal,
  getLocalDateString,
  getMonthlyEquivalent,
  validateSubscriptionInput,
} from '../utils/ledger';

interface SubscriptionFormModalProps {
  mode: 'add' | 'edit';
  initialSubscription?: Subscription | null;
  currency: CurrencyCode;
  onSave: (subData: Omit<Subscription, 'id' | 'createdAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const USAGE_OPTIONS: { id: UsageRating; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'rarely', label: 'Rarely' },
  { id: 'never', label: 'Never' },
];

export const SubscriptionFormModal: React.FC<SubscriptionFormModalProps> = ({
  mode,
  initialSubscription,
  currency,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState(initialSubscription?.name ?? '');
  const [costStr, setCostStr] = useState(
    initialSubscription ? String(initialSubscription.cost) : ''
  );
  const [cycle, setCycle] = useState<BillingCycle>(
    initialSubscription?.cycle ?? 'monthly'
  );
  const [renewalDate, setRenewalDate] = useState(
    initialSubscription?.renewalDate ?? getLocalDateString(7)
  );
  const [category, setCategory] = useState<CategoryId>(
    initialSubscription?.category ?? 'streaming'
  );
  const [usage, setUsage] = useState<UsageRating>(
    initialSubscription?.usage ?? 'daily'
  );

  const [touched, setTouched] = useState<{
    name: boolean;
    cost: boolean;
    renewalDate: boolean;
  }>({
    name: mode === 'edit',
    cost: mode === 'edit',
    renewalDate: mode === 'edit',
  });

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (initialSubscription && mode === 'edit') {
      setName(initialSubscription.name);
      setCostStr(String(initialSubscription.cost));
      setCycle(initialSubscription.cycle);
      setRenewalDate(initialSubscription.renewalDate);
      setCategory(initialSubscription.category);
      setUsage(initialSubscription.usage);
      setTouched({ name: true, cost: true, renewalDate: true });
    }
  }, [initialSubscription, mode]);

  const validation = validateSubscriptionInput({ name, costStr, renewalDate });
  const parsedCost = Number(costStr);
  const validNumericCost =
    costStr.trim() !== '' && !Number.isNaN(parsedCost) && parsedCost > 0
      ? parsedCost
      : 0;

  const monthlyEq = getMonthlyEquivalent(validNumericCost, cycle);
  const annualEq = getAnnualEquivalent(validNumericCost, cycle);
  const daysUntil = getDaysUntilRenewal(renewalDate);
  const currencySymbol = CURRENCY_CONFIG[currency]?.symbol || '$';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, cost: true, renewalDate: true });
    if (!validation.valid) return;

    onSave(
      {
        name: name.trim(),
        cost: Number(Number(costStr).toFixed(2)),
        cycle,
        renewalDate,
        category,
        usage,
      },
      initialSubscription?.id
    );
  };

  const applyQuickDate = (daysOffset: number) => {
    setRenewalDate(getLocalDateString(daysOffset));
    setTouched((prev) => ({ ...prev, renewalDate: true }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-xl bg-[#12151E] border-t sm:border border-[#222838] rounded-t-[20px] sm:rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
      >
        {/* Sheet Header with only one dismiss control (the X) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E2433] bg-[#090A0F]/60 shrink-0">
          <h2
            id="sub-modal-title"
            className="font-display text-base font-semibold text-white truncate"
          >
            {mode === 'add' ? 'Add Subscription' : 'Subscription Detail & Edit'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="min-h-[48px] min-w-[48px] -mr-2 flex items-center justify-center rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1A1F2C] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Scrolling Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Detail Summary Header */}
          <div className="bg-[#1A1F2C] border border-[#262D40] rounded-[18px] p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#94A3B8]">
                  {mode === 'edit' ? 'Active Ledger Entry' : 'Live Cost Preview'}
                  <span aria-hidden="true"> · </span>
                  <span
                    className={
                      daysUntil >= 0 && daysUntil <= 7
                        ? 'text-[#FFD06A] font-medium'
                        : 'text-[#94A3B8]'
                    }
                  >
                    {validation.errors.renewalDate
                      ? 'Invalid renewal date'
                      : `Renews ${formatRenewalCountdown(renewalDate)} (${formatDisplayDate(renewalDate)})`}
                  </span>
                </p>
                <h3 className="font-display text-lg font-bold text-white mt-1 truncate">
                  {name.trim() || 'Untitled Subscription'}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <div className="money-display text-2xl font-bold text-[#10F596]">
                  {`${formatMoney(monthlyEq, currency)}/mo`}
                </div>
                <div className="money-display text-xs text-[#10F596]/85 mt-0.5">
                  {`${formatMoney(annualEq, currency)}/yr`}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#262D40] flex items-center justify-between text-xs text-[#94A3B8]">
              <span>
                Billed {cycle === 'annual' ? 'annually' : 'monthly'} ·{' '}
                {USAGE_LABELS[usage]} usage
              </span>
              {(usage === 'rarely' || usage === 'never') && monthlyEq > 0 && (
                <span className="money-display text-[#10F596]">
                  {`Save ${formatMoney(monthlyEq, currency, true)}/mo`}
                </span>
              )}
            </div>
          </div>

          {/* Field 1: Subscription Name */}
          <div>
            <label
              htmlFor="sub-name-input"
              className="block text-sm font-medium text-[#F8FAFC] mb-2"
            >
              Subscription Name
            </label>
            <input
              id="sub-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!touched.name) setTouched((prev) => ({ ...prev, name: true }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              placeholder="e.g. Netflix Premium 4K"
              className={`w-full min-h-[52px] px-4 rounded-[16px] bg-[#090A0F] border text-white placeholder-[#64748B] text-base focus:outline-none transition-colors ${
                touched.name && validation.errors.name
                  ? 'border-rose-500/80 focus:border-rose-400'
                  : 'border-[#252B3B] focus:border-[#94A3B8]'
              }`}
            />
            {touched.name && validation.errors.name && (
              <p
                role="alert"
                className="mt-2 text-xs text-rose-400 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.errors.name}</span>
              </p>
            )}
          </div>

          {/* Field 2 & 3: Cost + Billing Cycle Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sub-cost-input"
                className="block text-sm font-medium text-[#F8FAFC] mb-2"
              >
                Cost ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-num text-[#94A3B8] text-base select-none">
                  {currencySymbol}
                </span>
                <input
                  id="sub-cost-input"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={costStr}
                  onChange={(e) => {
                    setCostStr(e.target.value);
                    if (!touched.cost)
                      setTouched((prev) => ({ ...prev, cost: true }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, cost: true }))}
                  placeholder="22.99"
                  className={`w-full min-h-[52px] pl-10 pr-4 rounded-[16px] bg-[#090A0F] border font-mono-num text-white placeholder-[#64748B] text-base focus:outline-none transition-colors ${
                    touched.cost && validation.errors.cost
                      ? 'border-rose-500/80 focus:border-rose-400'
                      : 'border-[#252B3B] focus:border-[#94A3B8]'
                  }`}
                />
              </div>
              {touched.cost && validation.errors.cost && (
                <p
                  role="alert"
                  className="mt-2 text-xs text-rose-400 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validation.errors.cost}</span>
                </p>
              )}
            </div>

            <div>
              <span className="block text-sm font-medium text-[#F8FAFC] mb-2">
                Billing Cycle
              </span>
              <div
                role="group"
                aria-label="Billing cycle"
                className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#090A0F] border border-[#252B3B] rounded-[16px] min-h-[52px]"
              >
                <button
                  type="button"
                  onClick={() => setCycle('monthly')}
                  className={`min-h-[40px] rounded-[12px] text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    cycle === 'monthly'
                      ? 'bg-[#1A1F2C] text-white border border-[#3B445E]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setCycle('annual')}
                  className={`min-h-[40px] rounded-[12px] text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    cycle === 'annual'
                      ? 'bg-[#1A1F2C] text-white border border-[#3B445E]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Annual
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[#94A3B8]">
                {cycle === 'annual'
                  ? 'Counts as cost ÷ 12 toward monthly total'
                  : 'Counts as cost × 12 toward yearly total'}
              </p>
            </div>
          </div>

          {/* Field 4: Renewal Date */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="sub-renewal-date"
                className="block text-sm font-medium text-[#F8FAFC]"
              >
                Next Renewal Date
              </label>
              <span className="text-xs text-[#94A3B8]">
                {daysUntil >= 0
                  ? formatRenewalCountdown(renewalDate)
                  : 'Past date not allowed'}
              </span>
            </div>
            <div className="relative">
              <input
                id="sub-renewal-date"
                type="date"
                value={renewalDate}
                onChange={(e) => {
                  setRenewalDate(e.target.value);
                  setTouched((prev) => ({ ...prev, renewalDate: true }));
                }}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, renewalDate: true }))
                }
                className={`w-full min-h-[52px] px-4 rounded-[16px] bg-[#090A0F] border font-mono-num text-white text-base focus:outline-none transition-colors ${
                  touched.renewalDate && validation.errors.renewalDate
                    ? 'border-rose-500/80 focus:border-rose-400'
                    : 'border-[#252B3B] focus:border-[#94A3B8]'
                }`}
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Quick set:
              </span>
              {[
                { label: 'In 2 days', offset: 2 },
                { label: 'In 5 days', offset: 5 },
                { label: 'In 14 days', offset: 14 },
                { label: 'In 30 days', offset: 30 },
              ].map((preset) => (
                <button
                  key={preset.offset}
                  type="button"
                  onClick={() => applyQuickDate(preset.offset)}
                  className="px-2.5 py-1 rounded-lg bg-[#1A1F2C] hover:bg-[#232A3B] text-xs text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {touched.renewalDate && validation.errors.renewalDate && (
              <p
                role="alert"
                className="mt-2 text-xs text-rose-400 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.errors.renewalDate}</span>
              </p>
            )}
          </div>

          {/* Field 5: Category Selector */}
          <div>
            <span className="block text-sm font-medium text-[#F8FAFC] mb-2">
              Category
            </span>
            <div
              role="group"
              aria-label="Category"
              className="grid grid-cols-2 sm:grid-cols-5 gap-2"
            >
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`min-h-[48px] px-3 py-2 rounded-[16px] border text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#1A1F2C] border-[#94A3B8] text-white'
                        : 'bg-[#090A0F] border-[#252B3B] text-[#94A3B8] hover:text-white hover:border-[#333B52]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 6: Usage Rating Selector (Compact 2x2 grid with one-word labels) */}
          <div>
            <span className="block text-sm font-medium text-[#F8FAFC] mb-2">
              Usage Rating
            </span>
            <div
              role="group"
              aria-label="Usage rating"
              className="grid grid-cols-2 gap-2.5"
            >
              {USAGE_OPTIONS.map((opt) => {
                const active = usage === opt.id;
                const isLowUsage = opt.id === 'rarely' || opt.id === 'never';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setUsage(opt.id)}
                    className={`min-h-[48px] px-4 py-2 rounded-[16px] border text-sm font-semibold transition-colors flex items-center justify-center whitespace-nowrap shrink-0 ${
                      active
                        ? isLowUsage
                          ? 'bg-[#1A1F2C] border-[#FFD06A] text-white'
                          : 'bg-[#1A1F2C] border-[#94A3B8] text-white'
                        : 'bg-[#090A0F] border-[#252B3B] text-[#94A3B8] hover:text-white hover:border-[#333B52]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Summary Block when blocked */}
          {(touched.name || touched.cost || touched.renewalDate) &&
            !validation.valid && (
              <div
                role="alert"
                className="p-4 rounded-[16px] bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 space-y-1"
              >
                <p className="font-semibold text-rose-300">
                  Fix the following before saving:
                </p>
                {validation.errors.name && <p>• {validation.errors.name}</p>}
                {validation.errors.cost && <p>• {validation.errors.cost}</p>}
                {validation.errors.renewalDate && (
                  <p>• {validation.errors.renewalDate}</p>
                )}
              </div>
            )}
        </div>

        {/* Sticky Docked Footer for Save & Delete */}
        <div className="shrink-0 p-4 sm:px-6 border-t border-[#1E2433] bg-[#090A0F]/95 space-y-2.5">
          {!confirmingDelete ? (
            <div className="flex items-center gap-2.5">
              {mode === 'edit' && initialSubscription && onDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="min-h-[50px] px-4 rounded-[16px] bg-[#12151E] hover:bg-rose-950/30 border border-[#252B3B] hover:border-rose-500/50 text-rose-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!validation.valid}
                className={`flex-1 min-h-[50px] px-5 rounded-[16px] font-display font-semibold text-base flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                  validation.valid
                    ? 'bg-[#1A1F2C] text-white border border-[#3B4661] hover:bg-[#232A3B] active:scale-[0.99] cursor-pointer'
                    : 'bg-[#12151E] text-[#64748B] border border-[#1E2433] cursor-not-allowed'
                }`}
              >
                <Check className="w-5 h-5" />
                <span>
                  {mode === 'add' ? 'Save Subscription' : 'Save Changes'}
                </span>
              </button>
            </div>
          ) : (
            mode === 'edit' &&
            initialSubscription &&
            onDelete && (
              <div
                role="alertdialog"
                aria-label="Confirm deletion"
                className="p-3.5 rounded-[16px] bg-[#12151E] border border-rose-500/50 space-y-2.5"
              >
                <p className="text-sm text-white font-medium">
                  Delete &ldquo;{initialSubscription.name}&rdquo;?
                </p>
                <p className="text-xs text-[#94A3B8]">
                  This removes{' '}
                  <span className="money-display text-[#10F596]">
                    {`${formatMoney(monthlyEq, currency)}/mo`}
                  </span>{' '}
                  (
                  <span className="money-display text-[#10F596]">
                    {`${formatMoney(annualEq, currency)}/yr`}
                  </span>
                  ) from your local ledger immediately.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="min-h-[48px] px-3 rounded-[14px] bg-[#1A1F2C] text-white text-sm font-medium hover:bg-[#232A3B] transition-colors whitespace-nowrap shrink-0"
                  >
                    Keep It
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(initialSubscription.id)}
                    className="min-h-[48px] px-3 rounded-[14px] bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </form>
    </div>
  );
};
