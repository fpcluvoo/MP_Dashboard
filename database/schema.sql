PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  internal_sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
) STRICT;

-- Marketplace/account/region identify a selling context, even when ASINs repeat.
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  marketplace TEXT NOT NULL,
  region TEXT NOT NULL,
  currency TEXT NOT NULL,
  name TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  UNIQUE(account_id, external_id),
  UNIQUE(id, account_id)
) STRICT;

-- Several seller SKUs can point to one listing, without duplicating ASIN facts.
CREATE TABLE IF NOT EXISTS marketplace_skus (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  listing_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  fulfillment TEXT NOT NULL,
  UNIQUE(account_id, sku),
  FOREIGN KEY(listing_id, account_id) REFERENCES listings(id, account_id)
) STRICT;

-- Monetary amounts are integer cents. NULL means missing, zero means reported zero.
CREATE TABLE IF NOT EXISTS listing_daily (
  listing_id TEXT NOT NULL REFERENCES listings(id),
  date TEXT NOT NULL,
  sessions INTEGER CHECK(sessions >= 0),
  units INTEGER CHECK(units >= 0),
  revenue_cents INTEGER CHECK(revenue_cents >= 0),
  refunded_units INTEGER CHECK(refunded_units >= 0),
  refund_cents INTEGER CHECK(refund_cents >= 0),
  source TEXT NOT NULL,
  PRIMARY KEY(listing_id, date)
) STRICT;

CREATE TABLE IF NOT EXISTS rating_snapshots (
  listing_id TEXT NOT NULL REFERENCES listings(id),
  date TEXT NOT NULL,
  rating REAL CHECK(rating BETWEEN 1 AND 5),
  rating_count INTEGER CHECK(rating_count >= 0),
  source TEXT NOT NULL,
  PRIMARY KEY(listing_id, date)
) STRICT;

-- A normalized source row is stored once: assigned to a listing OR unassigned.
CREATE TABLE IF NOT EXISTS ad_spend (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  listing_id TEXT,
  date TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK(ad_type IN ('SP', 'SB', 'SD', 'STV', 'OTHER')),
  spend_cents INTEGER NOT NULL CHECK(spend_cents >= 0),
  source TEXT NOT NULL,
  source_row_id TEXT NOT NULL,
  unassigned_reason TEXT,
  FOREIGN KEY(listing_id, account_id) REFERENCES listings(id, account_id),
  UNIQUE(account_id, source, source_row_id),
  CHECK((listing_id IS NULL AND unassigned_reason IS NOT NULL) OR
        (listing_id IS NOT NULL AND unassigned_reason IS NULL))
) STRICT;
CREATE INDEX IF NOT EXISTS ad_spend_period ON ad_spend(account_id, date);

-- Traffic definitions are channel-specific; pageviews are never stored as sessions.
CREATE TABLE IF NOT EXISTS traffic_daily (
  listing_id TEXT NOT NULL REFERENCES listings(id),
  date TEXT NOT NULL,
  page_views INTEGER CHECK(page_views >= 0),
  transactions INTEGER CHECK(transactions >= 0),
  PRIMARY KEY(listing_id,date)
) STRICT;
