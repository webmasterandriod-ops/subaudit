import {
  BillingCycle,
  CategoryId,
  CategoryMeta,
  CategoryStat,
  CurrencyCode,
  Subscription,
  UsageRating,
} from '../types';

export const CATEGORIES: CategoryMeta[] = [
  { id: 'streaming', label: 'Streaming', description: 'Video, live TV, cinema memberships' },
  { id: 'music', label: 'Music', description: 'Audio streaming, podcasts, DJ tools' },
  { id: 'apps', label: 'Apps', description: 'Productivity, cloud software, utilities' },
  { id: 'fitness', label: 'Fitness', description: 'Gyms, training clubs, wellness coaching' },
  { id: 'other', label: 'Other', description: 'Storage, news, domain & miscellaneous' },
];

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  streaming: 'Streaming',
  music: 'Music',
  apps: 'Apps',
  fitness: 'Fitness',
  other: 'Other',
};

export const USAGE_LABELS: Record<UsageRating, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  rarely: 'Rarely',
  never: 'Never',
};

export const USAGE_RANK_WEIGHT: Record<UsageRating, number> = {
  never: 0,
  rarely: 1,
  weekly: 2,
  daily: 3,
};

export const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { symbol: string; label: string; decimals: number }
> = {
  USD: { symbol: '$', label: 'USD ($)', decimals: 2 },
  EUR: { symbol: '€', label: 'EUR (€)', decimals: 2 },
  GBP: { symbol: '£', label: 'GBP (£)', decimals: 2 },
  CAD: { symbol: 'CA$', label: 'CAD (CA$)', decimals: 2 },
  AUD: { symbol: 'A$', label: 'AUD (A$)', decimals: 2 },
  JPY: { symbol: '¥', label: 'JPY (¥)', decimals: 0 },
};

/**
 * Returns local YYYY-MM-DD string for a date offset by `daysOffset` from today.
 */
export function getLocalDateString(daysOffset = 0): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parses a YYYY-MM-DD string into local midnight Date.
 */
export function parseLocalDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

/**
 * Computes integer days from today (local midnight) until renewalDate.
 * Negative means in the past, 0 means today, positive means in N days.
 */
export function getDaysUntilRenewal(renewalDateStr: string): number {
  const target = parseLocalDate(renewalDateStr);
  if (!target) return -999;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatRenewalCountdown(renewalDateStr: string): string {
  const days = getDaysUntilRenewal(renewalDateStr);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'in 1 day';
  return `in ${days} days`;
}

export function formatDisplayDate(renewalDateStr: string): string {
  const dt = parseLocalDate(renewalDateStr);
  if (!dt) return renewalDateStr;
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Live totals rule:
 * Annual subscriptions count as cost / 12 toward monthly total, and cost toward yearly total.
 * Monthly subscriptions count as cost toward monthly total, and cost * 12 toward yearly total.
 */
export function getMonthlyEquivalent(cost: number, cycle: BillingCycle): number {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  return cycle === 'annual' ? cost / 12 : cost;
}

export function getAnnualEquivalent(cost: number, cycle: BillingCycle): number {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  return cycle === 'monthly' ? cost * 12 : cost;
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = 'USD',
  includePlus = false
): string {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = safe.toLocaleString('en-US', {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const prefix = includePlus && safe > 0 ? '+' : '';
  return `${prefix}${cfg.symbol}${formatted}`;
}

export function calculateLedgerTotals(subscriptions: Subscription[]) {
  let monthlyTotal = 0;
  let yearlyTotal = 0;

  for (const sub of subscriptions) {
    monthlyTotal += getMonthlyEquivalent(sub.cost, sub.cycle);
    yearlyTotal += getAnnualEquivalent(sub.cost, sub.cycle);
  }

  return {
    monthlyTotal: Number(monthlyTotal.toFixed(2)),
    yearlyTotal: Number(yearlyTotal.toFixed(2)),
    activeCount: subscriptions.length,
  };
}

/**
 * Cancel candidates ranking rule:
 * Never-used first, then rarely-used, then weekly, then daily;
 * within each usage group, highest monthly cost first.
 */
export function rankSubscriptionsByAuditRule(subscriptions: Subscription[]): Subscription[] {
  return [...subscriptions].sort((a, b) => {
    const usageDiff = USAGE_RANK_WEIGHT[a.usage] - USAGE_RANK_WEIGHT[b.usage];
    if (usageDiff !== 0) return usageDiff;
    const monthlyA = getMonthlyEquivalent(a.cost, a.cycle);
    const monthlyB = getMonthlyEquivalent(b.cost, b.cycle);
    return monthlyB - monthlyA;
  });
}

/**
 * Returns subscriptions that are prime cancel candidates (Never or Rarely used),
 * ordered by the exact ranking rule, plus recoverable monthly/yearly savings.
 */
export function getAuditMetrics(subscriptions: Subscription[]) {
  const allRanked = rankSubscriptionsByAuditRule(subscriptions);
  const wasteCandidates = allRanked.filter(
    (s) => s.usage === 'never' || s.usage === 'rarely'
  );

  let recoverableMonthly = 0;
  for (const sub of wasteCandidates) {
    recoverableMonthly += getMonthlyEquivalent(sub.cost, sub.cycle);
  }
  const recoverableYearly = recoverableMonthly * 12;

  return {
    allRanked,
    wasteCandidates,
    recoverableMonthly: Number(recoverableMonthly.toFixed(2)),
    recoverableYearly: Number(recoverableYearly.toFixed(2)),
  };
}

/**
 * Renewals groups:
 * - next7Days: renewing within 0..7 days
 * - next8To30Days: renewing within 8..30 days
 * - allNext30Days: renewing within 0..30 days
 */
export function getRenewalGroups(subscriptions: Subscription[]) {
  const sorted = [...subscriptions].sort(
    (a, b) => getDaysUntilRenewal(a.renewalDate) - getDaysUntilRenewal(b.renewalDate)
  );

  const next7Days = sorted.filter((s) => {
    const d = getDaysUntilRenewal(s.renewalDate);
    return d >= 0 && d <= 7;
  });

  const next8To30Days = sorted.filter((s) => {
    const d = getDaysUntilRenewal(s.renewalDate);
    return d >= 8 && d <= 30;
  });

  const allNext30Days = sorted.filter((s) => {
    const d = getDaysUntilRenewal(s.renewalDate);
    return d >= 0 && d <= 30;
  });

  const sumMonthly = (items: Subscription[]) =>
    Number(
      items
        .reduce((acc, s) => acc + getMonthlyEquivalent(s.cost, s.cycle), 0)
        .toFixed(2)
    );

  return {
    next7Days,
    next7DaysTotal: sumMonthly(next7Days),
    next8To30Days,
    next8To30DaysTotal: sumMonthly(next8To30Days),
    allNext30Days,
    allNext30DaysTotal: sumMonthly(allNext30Days),
    sortedAll: sorted,
  };
}

/**
 * Categories breakdown with totals and share percentages.
 */
export function getCategoryBreakdown(subscriptions: Subscription[]): CategoryStat[] {
  const { monthlyTotal } = calculateLedgerTotals(subscriptions);

  const stats: CategoryStat[] = CATEGORIES.map((cat) => {
    const items = subscriptions.filter((s) => s.category === cat.id);
    const catMonthly = items.reduce(
      (acc, s) => acc + getMonthlyEquivalent(s.cost, s.cycle),
      0
    );
    const catYearly = items.reduce(
      (acc, s) => acc + getAnnualEquivalent(s.cost, s.cycle),
      0
    );
    const sharePercent =
      monthlyTotal > 0
        ? Math.floor(((catMonthly / monthlyTotal) * 100 + 1e-9) * 10) / 10
        : 0;

    return {
      id: cat.id,
      label: cat.label,
      monthlyTotal: Number(catMonthly.toFixed(2)),
      yearlyTotal: Number(catYearly.toFixed(2)),
      sharePercent,
      count: items.length,
      items,
    };
  });

  const sorted = stats.sort((a, b) => b.monthlyTotal - a.monthlyTotal);

  if (monthlyTotal > 0) {
    const activeIndices = sorted
      .map((s, idx) => (s.monthlyTotal > 0 ? idx : -1))
      .filter((idx) => idx !== -1);
    if (activeIndices.length > 1) {
      const lastActiveIdx = activeIndices[activeIndices.length - 1];
      const sumOthers = activeIndices
        .slice(0, -1)
        .reduce((acc, idx) => acc + sorted[idx].sharePercent, 0);
      sorted[lastActiveIdx].sharePercent = Number(
        Math.max(0, 100 - sumOthers).toFixed(1)
      );
    }
  }

  return sorted;
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    cost?: string;
    renewalDate?: string;
  };
}

export function validateSubscriptionInput(input: {
  name: string;
  costStr: string;
  renewalDate: string;
}): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    errors.name = 'Missing name. Enter a subscription name (for example, Netflix Premium 4K).';
  } else if (trimmedName.length > 60) {
    errors.name = 'Name must be 60 characters or fewer.';
  }

  const parsedCost = Number(input.costStr);
  if (input.costStr.trim() === '' || Number.isNaN(parsedCost)) {
    errors.cost = 'Enter a valid number for the billing amount.';
  } else if (parsedCost <= 0) {
    errors.cost = 'Amount cannot be $0.00 or less. Enter a cost greater than 0.00.';
  } else if (parsedCost > 99999) {
    errors.cost = 'Amount looks unusually high. Enter an amount under 100,000.';
  }

  if (!input.renewalDate) {
    errors.renewalDate = 'Pick a renewal date.';
  } else {
    const dt = parseLocalDate(input.renewalDate);
    if (!dt) {
      errors.renewalDate = 'Impossible date format. Use a valid YYYY-MM-DD date.';
    } else {
      const days = getDaysUntilRenewal(input.renewalDate);
      if (days < 0) {
        errors.renewalDate = 'Past renewal date. Pick today or an upcoming renewal date.';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Default Stitch Design Dataset:
 * Matches:
 * - Home: $142.50/mo and $1,710.00/yr
 * - Detail: Netflix Premium 4K, $22.99/mo, $275.88/yr
 * - Renewals: Next 7 days $86.99 (Netflix Premium 4K in 2 days, Metro Iron Gym Pass in 5 days)
 * - Categories: Fitness $64.00 (44.9%), Streaming $37.98 (26.6%), Apps $19.99 (14.0%), Music $14.99 (10.5%), Other $5.54 (4.0%), total $142.50/mo.
 */
export function getStitchDefaultDataset(): Subscription[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: 'sub-netflix-4k',
      name: 'Netflix Premium 4K',
      cost: 22.99,
      cycle: 'monthly',
      renewalDate: getLocalDateString(2),
      category: 'streaming',
      usage: 'daily',
      createdAt: nowIso,
    },
    {
      id: 'sub-metro-gym',
      name: 'Metro Iron Gym Pass',
      cost: 64.0,
      cycle: 'monthly',
      renewalDate: getLocalDateString(5),
      category: 'fitness',
      usage: 'weekly',
      createdAt: nowIso,
    },
    {
      id: 'sub-niche-stream',
      name: 'Niche Streaming Pass',
      cost: 14.99,
      cycle: 'monthly',
      renewalDate: getLocalDateString(11),
      category: 'streaming',
      usage: 'rarely',
      createdAt: nowIso,
    },
    {
      id: 'sub-unused-meditation',
      name: 'Unused Meditation App',
      cost: 155.88, // $12.99/mo equivalent
      cycle: 'annual',
      renewalDate: getLocalDateString(16),
      category: 'apps',
      usage: 'rarely',
      createdAt: nowIso,
    },
    {
      id: 'sub-hifi-music',
      name: 'Hi-Fi Music Family',
      cost: 14.99,
      cycle: 'monthly',
      renewalDate: getLocalDateString(21),
      category: 'music',
      usage: 'daily',
      createdAt: nowIso,
    },
    {
      id: 'sub-cloud-notes',
      name: 'Cloud Pro Notes',
      cost: 7.0,
      cycle: 'monthly',
      renewalDate: getLocalDateString(25),
      category: 'apps',
      usage: 'weekly',
      createdAt: nowIso,
    },
    {
      id: 'sub-cloud-vault',
      name: 'Cloud Vault Backup',
      cost: 66.48, // $5.54/mo equivalent
      cycle: 'annual',
      renewalDate: getLocalDateString(28),
      category: 'other',
      usage: 'never',
      createdAt: nowIso,
    },
  ];
}

/**
 * Stitch Cancel Candidates Design Dataset:
 * Includes #1 Adobe Creative Cloud $54.99/mo (Never), #2 Niche Streaming Pass $14.99/mo (Rarely),
 * #3 Unused Meditation App $12.99/mo equivalent (Rarely).
 */
export function getStitchAuditShowcaseDataset(): Subscription[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: 'sub-adobe-cc',
      name: 'Adobe Creative Cloud',
      cost: 54.99,
      cycle: 'monthly',
      renewalDate: getLocalDateString(9),
      category: 'apps',
      usage: 'never',
      createdAt: nowIso,
    },
    {
      id: 'sub-niche-stream',
      name: 'Niche Streaming Pass',
      cost: 14.99,
      cycle: 'monthly',
      renewalDate: getLocalDateString(14),
      category: 'streaming',
      usage: 'rarely',
      createdAt: nowIso,
    },
    {
      id: 'sub-unused-meditation',
      name: 'Unused Meditation App',
      cost: 155.88, // $12.99/mo equivalent
      cycle: 'annual',
      renewalDate: getLocalDateString(19),
      category: 'apps',
      usage: 'rarely',
      createdAt: nowIso,
    },
    {
      id: 'sub-netflix-4k',
      name: 'Netflix Premium 4K',
      cost: 22.99,
      cycle: 'monthly',
      renewalDate: getLocalDateString(2),
      category: 'streaming',
      usage: 'daily',
      createdAt: nowIso,
    },
    {
      id: 'sub-metro-gym',
      name: 'Metro Iron Gym Pass',
      cost: 64.0,
      cycle: 'monthly',
      renewalDate: getLocalDateString(5),
      category: 'fitness',
      usage: 'weekly',
      createdAt: nowIso,
    },
  ];
}

export function generateCsvContent(subscriptions: Subscription[]): string {
  const headers = [
    'ID',
    'Name',
    'Billing Cost',
    'Billing Cycle',
    'Monthly Equivalent',
    'Yearly Equivalent',
    'Renewal Date',
    'Category',
    'Usage Rating',
  ];
  const rows = subscriptions.map((s) => {
    const monthly = getMonthlyEquivalent(s.cost, s.cycle).toFixed(2);
    const yearly = getAnnualEquivalent(s.cost, s.cycle).toFixed(2);
    const escapedName = `"${s.name.replace(/"/g, '""')}"`;
    return [
      s.id,
      escapedName,
      s.cost.toFixed(2),
      s.cycle,
      monthly,
      yearly,
      s.renewalDate,
      s.category,
      s.usage,
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}
