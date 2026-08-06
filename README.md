# Six Days

A live, connected visualization of NYC restaurant closures and recorded reopenings. The website queries the DOHMH New York City Restaurant Inspection Results dataset through NYC Open Data and recalculates its metrics from source records.

## Current phase

This phase visualizes the evidence behind the Closure-to-Reopening Navigator:

- recorded closure-to-reopening rate;
- median recorded days to reopening;
- distribution of reopening times; and
- violation codes most often present at closure.

Repeated source rows are grouped into inspection events. Each closure is matched to the next later recorded reopening for the same restaurant identifier (CAMIS).

## Next phase

Build the functional Closure-to-Reopening Navigator with a database, restaurant search, plain-language issue grouping, and a prioritized reopening plan.

## Data source

[DOHMH New York City Restaurant Inspection Results](https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j)
