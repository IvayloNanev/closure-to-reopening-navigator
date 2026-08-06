# Closure-to-Reopening Navigator

A decision-support MVP for independent NYC restaurant owners and managers after a DOHMH closure.

## Problem

Restaurant inspection data is published as technical violation rows. After a closure, an owner needs to understand what must be fixed, coordinate the work, and prepare for reopening while the business is losing revenue.

## MVP

The Closure-to-Reopening Navigator will turn a restaurant's closure inspection into:

- plain-language issue categories;
- a prioritized reopening checklist;
- a suggested order of work;
- the restaurant's closure-to-reopening timeline; and
- benchmarks from similar recorded closure cases.

## Evidence

Analysis of NYC Open Data identified 1,550 recorded restaurant closure events. Of those, 1,385 (89.4%) had a later recorded reopening, with a median recorded interval of six days.

Violation code `08A`, covering conditions conducive to pests, appeared in 76.2% of recorded closure events. The number of violation codes alone had only a weak relationship with reopening time, supporting an issue-specific plan rather than a longer undifferentiated list.

## Primary user

An independent restaurant owner or manager immediately after a DOHMH closure.

## Initial product flow

1. Find or select a restaurant.
2. Load its recorded closure inspection.
3. Group technical violation rows into understandable issue categories.
4. Generate a prioritized reopening checklist.
5. Show relevant history and benchmarks from similar recorded cases.

## Status

Project initialization and MVP definition.
