/** App-side view of store products. Prices are store-formatted strings, never hardcoded. */
export type PlanKind = 'annual' | 'monthly';

export type PlanPackage = {
  /** RevenueCat package identifier. */
  id: string;
  productId: string;
  kind: PlanKind;
  price: number;
  priceString: string;
  currencyCode: string;
  /** Store-computed per-month price for the annual plan. */
  perMonthString: string | null;
  /** Free-trial length, only when the product really has a free trial. */
  trialDays: number | null;
  /** Paid introductory price (welcome offer), e.g. the first year at a lower price. */
  introPriceString: string | null;
};

export type Offering = {
  id: string;
  annual: PlanPackage | null;
  monthly: PlanPackage | null;
};

export type OfferingId = 'default' | 'welcome_offer';

export type PurchaseOutcome =
  | { status: 'purchased'; isPro: boolean }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export interface PurchasesClient {
  /** True for the in-memory dev store (no RevenueCat key, web, tests). */
  readonly isMock: boolean;
  configure(): Promise<void>;
  getOffering(id: OfferingId): Promise<Offering | null>;
  purchase(pkg: PlanPackage): Promise<PurchaseOutcome>;
  restore(): Promise<boolean>;
  isPro(): Promise<boolean>;
  onChange(listener: (isPro: boolean) => void): () => void;
  /** Opens RevenueCat Customer Center (manage / cancel). */
  manage(): Promise<void>;
  /** Forgets the anonymous RevenueCat user ("Delete all my data"). */
  reset(): Promise<void>;
}

export const ENTITLEMENT = 'pro';
export const PRODUCTS = { annual: 'culprit_annual_3990', monthly: 'culprit_monthly_999' } as const;
