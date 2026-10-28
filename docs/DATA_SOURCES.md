# How Culprit's information works

Culprit uses **no AI and no live lookups while people use the app**. Everything ships inside the app as
data files (`assets/data/*.json`) built by scripts in `data-pipeline/`, plus fixed rules in `src/engines/`.
Each user's answers, check-ins and results stay on their phone. The core features make **zero API calls**,
so there's no per-user cost no matter how many people use the app.

| What | Where it comes from | How sure |
| --- | --- | --- |
| Stores near you | ZIP → first 3 digits → state (built-in table). Each of 81 stores lists the states where it has locations (public store-locator footprints, rounded to whole states). "Near you" = stores in your state; leading grocers first. Everyone can still pick any store, search, or type a local store. | Good for ordering; a store can be missing from your exact town |
| What each store sells | Each store has a type (supermarket, big-box, discount, warehouse club, natural, international, drugstore, dollar, online). The type says which aisles it sells fully, partly or not at all (drugstores: no fresh produce or meat, only some pantry items). A list can only go to a store that fully sells every aisle on it. Per-store overrides fix exceptions. | Good general rules; individual stores vary |
| My stores & the best store | People pick every store they use. Each week the list is priced at each of their stores that can sell all of it; the cheapest wins (unless they switch manually). If two stores together save at least $8, the app offers to split the list. Skincare goes to the cheapest of their stores that sells skincare. All on the phone, in milliseconds. | Only as good as the price estimates |
| Grocery prices | A typical store-brand price per item (hand-estimated) × a regional factor × the store's price tier (discount ≈ 0.85–0.9, typical 1.0, premium 1.1–1.3) × a category factor for its type (warehouse clubs cheaper on pantry staples, drugstores dearer on food). `npm run content:prices` refreshes base prices and regions from U.S. Bureau of Labor Statistics data (free, public domain). | Estimate, always labelled "est." |
| Skincare stores | Any store that sells skincare, with a store-brand skincare price level by type (or per store, e.g. Walmart's Equate). | Estimate, labelled "est." |
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
