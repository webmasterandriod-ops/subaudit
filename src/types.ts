export type BillingCycle = 'monthly' | 'annual';

export type CategoryId = 'streaming' | 'music' | 'apps' | 'fitness' | 'other';

export type UsageRating = 'daily' | 'weekly' | 'rarely' | 'never';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export type ReminderWindow = 1 | 3 | 7;

export type ActiveTab = 'home' | 'audit' | 'renewals' | 'categories' | 'settings';

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  cycle: BillingCycle;
  renewalDate: string; // YYYY-MM-DD
  category: CategoryId;
  usage: UsageRating;
  createdAt: string;
}

export interface AppSettings {
  currency: CurrencyCode;
  reminderDays: ReminderWindow;
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
}

export interface CategoryStat {
  id: CategoryId;
  label: string;
  monthlyTotal: number;
  yearlyTotal: number;
  sharePercent: number;
  count: number;
  items: Subscription[];
}
