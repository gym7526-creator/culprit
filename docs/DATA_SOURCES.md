# How Culprit's information works

Culprit uses **no AI and no live lookups while people use the app**. Everything ships inside the app as
data files (`assets/data/*.json`) built by scripts in `data-pipeline/`, plus fixed rules in `src/engines/`.
Each user's answers, check-ins and results stay on their phone. The core features make **zero API calls**,
so there's no per-user cost no matter how many people use the app.

| What | Where it comes from | How sure |
| --- | --- | --- |
| Stores near you | ZIP → first 3 digits → state (built-in table). Each of 55 grocery chains lists the states where it has stores (public store-locator footprints, rounded to whole states). "Near you" = chains with stores in your state; leading grocers first. Everyone can still pick any chain, search, or type a local store. | Good for ordering; a chain can be missing a store in your exact town |
| Grocery prices | A typical store-brand price per item (hand-estimated) × a regional factor × the store's price tier (discount ≈ 0.85–0.9, typical 1.0, premium 1.1–1.3). `npm run content:prices` refreshes base prices and regions from U.S. Bureau of Labor Statistics data (free, public domain). | Estimate, always labelled "est." |
| Skincare stores | 7 places people buy skincare (Walmart, Target, CVS, Walgreens, Amazon, Costco/Sam's, grocery aisle), each with a store-brand price index. | Estimate, labelled "est." |
| Skincare products | 6 product types, described only by label facts (e.g. "benzoyl peroxide 4–5%"). Rules from the American Academy of Dermatology. | Sourced |
| Food test protocol | NHS 3-day reintroduction protocol | Sourced |
| FODMAP / reflux levels per ingredient | General public knowledge (never Monash data) | **Needs a dietitian's review before launch** |
| Recipes | 150 written for Culprit; tags are computed from ingredients by the build script, never typed by hand | Checked by `npm run content:validate` |

## Refreshing data (on a computer, a few times a year)

1. `npm run content:prices`: pulls BLS average prices (free) and rebuilds.
2. `PEXELS_API_KEY=… npm run content:photos`: finds a licensed photo per recipe (free key).
3. Review, commit, ship an app update. Users get the new data with the update. No server needed.

## Improving accuracy later (optional)

- Spot-check skincare and grocery prices against store websites and adjust `data-pipeline/source/*.ts`.
- Have a dietitian review `data-pipeline/source/ingredients-*.ts`.
- A real "stores within 5 miles" finder would need a paid maps API charged per lookup. Not recommended for the MVP.
