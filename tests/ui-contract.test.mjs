import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const journey=await readFile(new URL("../app/ConnectedJourney.tsx",import.meta.url),"utf8");
const chapters=await readFile(new URL("../app/BookChapters.tsx",import.meta.url),"utf8");
const theme=await readFile(new URL("../app/theme.css",import.meta.url),"utf8");
const inspections=await readFile(new URL("../lib/inspections.ts",import.meta.url),"utf8");
const serviceWorker=await readFile(new URL("../public/six-days-sw.js",import.meta.url),"utf8");
const offlineSample=await readFile(new URL("../lib/offline-sample.ts",import.meta.url),"utf8");

test("search exposes combobox state and keyboard controls",()=>{
  for(const token of ['role="combobox"','aria-expanded','aria-controls','aria-activedescendant','ArrowDown','ArrowUp','Escape'])assert.ok(journey.includes(token),token);
});

test("page navigation restores history and moves focus",()=>{
  for(const token of ['pushState','popstate','data-page-heading','heading?.focus()'])assert.ok(chapters.includes(token),token);
});

test("every Start control performs a complete journey reset",()=>{
  assert.ok(chapters.includes('const resetJourney='));
  assert.ok(chapters.includes('index===0&&active>0?resetJourney():go(index)'));
  assert.ok(chapters.includes('index===1?resetJourney():go(index-1)'));
  assert.ok(chapters.includes('window.scrollTo({top:0,behavior:"auto"})'));
});

test("no-closure journey ends after the verified inspection record",()=>{
  assert.ok(chapters.includes('page.props.id==="top"||page.props.id==="find"'));
  assert.ok(chapters.includes('const inspectionLabels=["Start","Inspection record"]'));
});

test("maps use an accessible HTML control list",()=>{
  assert.ok(journey.includes('ACCESSIBLE MAP CONTROLS'));
  assert.ok(journey.includes('aria-pressed={item.id===focusedId}'));
  assert.ok(journey.includes('aria-hidden="true"'));
});

test("comparison markers retain a coordinate projection without boundary geometry",()=>{
  assert.match(journey,/\(\(longitude\+74\.26\)\/\.56\)\*720/);
  assert.doesNotMatch(journey,/projection\?\{x:[^}]+\}:\{x:0,y:0\}/);
});

test("NYC map geometry bypasses the framework response-size cache",()=>{
  assert.ok(inspections.includes('fetch(BOROUGH_BOUNDARIES, { cache: "no-store" })'));
  assert.ok(serviceWorker.includes('six-days-offline-v3'));
});

test("small samples and overlapping locations have explicit treatments",()=>{
  assert.ok(journey.includes('SmallSampleDotPlot'));
  assert.ok(journey.includes('LIMITED EVIDENCE'));
  assert.ok(journey.includes('numbered markers contain multiple closure records'));
});

test("Step 3 defines its median calculation in comparison scope",()=>{
  assert.match(journey,/function ComparisonResultsPage[\s\S]*?const median=/);
  assert.ok(journey.includes('HISTORICAL MEDIAN RECORDED REOPENING TIME'));
  assert.ok(journey.includes('These historical figures are evidence—not an estimated reopening date.'));
});

test("landing page does not block on the full NYC comparison dataset",()=>{
  assert.ok(journey.includes('fetch("/api/navigator-data"'));
  assert.ok(journey.includes('Historical comparisons are temporarily unavailable. Live restaurant search still works.'));
});

test("the sample journey has a bundled offline dataset",()=>{
  assert.ok(journey.includes('offlineSampleEpisodes'));
  assert.ok(journey.includes('selectedCamis=selected?.camis.startsWith("900000")?undefined'));
  assert.ok(journey.includes('setFetchState("success")'));
  assert.ok(journey.includes('setComparisonData(current=>({...current'));
  assert.ok(journey.includes('episodes:offlineSampleEpisodes,events:offlineSampleEvents'));
  assert.ok(journey.includes('navigator.serviceWorker.register("/six-days-sw.js")'));
});

test("the selected sample represents a currently closed restaurant",()=>{
  assert.ok(offlineSample.includes('activeClosure("90000001","SIX DAYS SAMPLE KITCHEN"'));
  assert.ok(offlineSample.includes('reopening:null'));
  assert.ok(journey.includes('setLatest([saved.closure])'));
});

test("the full sample comparison remains available without the live API",()=>{
  for(const record of [
    'episode("90000002","SAMPLE CAFE NORTH","Manhattan","2026-05-04","2026-05-06",2',
    'episode("90000003","SAMPLE TABLE EAST","Manhattan","2026-04-10","2026-04-14",4',
    'episode("90000004","SAMPLE GRILL SOUTH","Manhattan","2026-03-02","2026-03-07",5',
    'episode("90000005","SAMPLE DELI WEST","Manhattan","2026-02-12","2026-02-19",7',
  ])assert.ok(offlineSample.includes(record),record);
  assert.ok(offlineSample.includes('item.reopening?[item.closure,item.reopening]:[item.closure]'));
  assert.ok(journey.includes('setComparisonData(bundledData)'));
});

test("the complete match stays within the selected restaurant borough",()=>{
  assert.ok(journey.includes('scope:"borough",boroughOverride:selected.borough'));
  assert.ok(journey.includes('find closures in the same borough with the exact same complete code set'));
  assert.equal((offlineSample.match(/"Manhattan"/g)??[]).length,5);
});

test("Step 3 identifies every exact record used in its analysis",()=>{
  assert.ok(journey.includes('EXACT MATCHES USED IN STEP 3'));
  assert.ok(journey.includes('Exact closure records used in the comparison'));
  assert.ok(journey.includes('These exact records—not every NYC closure—are the evidence used'));
});

test("restaurant verification and historical comparisons disclose different freshness",()=>{
  assert.ok(journey.includes('cache:"no-store"'));
  assert.ok(journey.includes('DIRECT NYC REQUEST'));
  assert.ok(journey.includes('CACHED COMPARISON SNAPSHOT'));
  assert.ok(journey.includes('Historical comparison data is cached for up to 6 hours'));
  assert.ok(journey.includes('browser caching disabled'));
  assert.ok(theme.includes('.data-freshness.direct'));
  assert.ok(theme.includes('.data-freshness.comparison'));
});

test("comparison evidence is integrated into the planning range",()=>{
  assert.ok(journey.includes('What supports this range:'));
  assert.ok(!journey.includes('WHY THESE RESTAURANTS WERE COMPARED'));
});

test("violation evidence appears before financial planning",()=>{
  assert.ok(theme.indexOf('.comparison-results-page > .violation-paths { order: 8; }') < theme.indexOf('.comparison-results-page > .scenario-calculator { order: 9; }'));
});

test("violation persistence includes restaurant-level recorded time",()=>{
  assert.ok(journey.includes('className="timed-stage"'));
  assert.ok(journey.includes('`Median ${median(days)} days`'));
  assert.ok(journey.includes('`Range ${days[0]}–${days.at(-1)} days`'));
  assert.ok(journey.includes('do not prove how long a violation took to correct'));
});

test("historical evidence scenarios section is removed",()=>{
  assert.ok(!journey.includes('HISTORICAL EVIDENCE SCENARIOS'));
  assert.ok(!journey.includes('planning-scenario-results'));
});

test("Step 2 option selection preserves the viewport",()=>{
  assert.ok(journey.includes('chooseWithoutMoving'));
  assert.ok(journey.includes('window.scrollTo({top,behavior:"auto"})'));
  assert.ok(journey.includes('onPointerDown={anchorPointer}'));
  assert.ok(journey.includes('focus({preventScroll:true})'));
  assert.ok(theme.includes('.context-step,.custom-comparison { overflow-anchor: none; }'));
  assert.ok(journey.includes('aria-pressed={mode==="exact"}'));
  assert.ok(journey.includes('aria-pressed={mode==="custom"}'));
  assert.ok(!journey.includes('— selected'));
  assert.ok(journey.includes('const next=mode===option?null:option'));
  assert.ok(journey.includes('Unselect Option 1'));
  assert.ok(journey.includes('Unselect Option 2'));
  assert.ok(journey.includes('Comparison result placeholder'));
  assert.ok(theme.includes('.comparison-path-card > .comparison-preview.visible { visibility: visible; }'));
});

test("Step 3 explicitly reports an empty comparison group",()=>{
  assert.ok(journey.includes('comparisonConfigured'));
  assert.ok(journey.includes('No matching comparison records found'));
  assert.ok(journey.includes('COMPARISON RESULT · 0 MATCHES'));
  assert.ok(journey.includes('cannot calculate a historical reopening median'));
  assert.ok(journey.includes('No exact matching closures found. Choose Option 2'));
  assert.ok(journey.includes('No closures match these settings yet. Broaden the codes, area, or match strength.'));
});

test("audited reset and planning states are explicit",()=>{
  assert.ok(journey.includes('six-days-request-reset'));
  assert.ok(journey.includes('window.confirm("Start another journey?'));
  assert.ok(journey.includes('Not calculated'));
  assert.ok(journey.includes('Print brief with blanks'));
  assert.ok(journey.includes('exactMatchCount={draftCohort.length}'));
  assert.ok(!journey.includes('burden tolerance'));
});

test("Step 3 does not present blank financial inputs as zero exposure",()=>{
  assert.ok(journey.includes('const hasFinancialInput=[plan.fixed,plan.labor,plan.inventory,plan.margin].some(value=>value>0)'));
  assert.ok(journey.includes('hasFinancialInput?money(daily*item.days+Math.max(0,plan.inventory)):"Not calculated"'));
  assert.ok(journey.includes('Enter at least one cost above to calculate this estimate.'));
});

test("print view and semantic status tokens exist",()=>{
  assert.ok(theme.includes('@media print'));
  for(const token of ['--sd-accent','--sd-danger','--sd-success','--sd-focus'])assert.ok(theme.includes(token),token);
});

test("every journey page opens with an accessible book transition",()=>{
  assert.ok(theme.includes('.journey-page:not([hidden])'));
  assert.ok(theme.includes('animation: originalBookPageOpen'));
  assert.ok(theme.includes('@keyframes originalBookPageOpen'));
  assert.ok(theme.includes('@keyframes originalBookPageOpenRight'));
  assert.ok(theme.includes('@keyframes originalBookEdge'));
  assert.ok(theme.includes('width: 18%;'));
  assert.ok(theme.includes('border-radius: 0 var(--sd-radius) var(--sd-radius) 0'));
  assert.ok(chapters.includes('journey-page fold-from-right-edge'));
  assert.ok(!chapters.includes('index%2?"turn-from-right":"turn-from-left"'));
  assert.ok(chapters.includes('setPageTurn(value=>value+1)'));
  assert.ok(chapters.includes('six-days-page-turn-complete'));
  assert.ok(!chapters.includes('physical-page-sheet'));
  assert.ok(!theme.includes('@keyframes physicalCurlHighlight'));
  assert.ok(!theme.includes('@keyframes turnPageForward'));
  assert.match(theme,/prefers-reduced-motion:[\s\S]*\.journey-page:not\(\[hidden\]\)/);
});

test("bar and line charts animate as evidence is revealed",()=>{
  assert.ok(journey.includes('function ChartViewportObserver'));
  assert.ok(journey.includes('IntersectionObserver'));
  assert.ok(journey.includes('is-chart-visible'));
  assert.ok(chapters.includes('six-days-page-turn-complete'));
  assert.ok(journey.includes('six-days-page-turn-complete'));
  assert.ok(journey.includes('.journey-page:not([hidden])'));
  assert.ok(theme.includes('@keyframes chartBarGrow'));
  assert.ok(theme.includes('@keyframes trendLineDraw'));
  assert.ok(theme.includes('@keyframes trendPointReveal'));
  assert.ok(theme.includes('.planning-distribution-bars article i b'));
  assert.ok(theme.includes('.trend-segment.second'));
  assert.ok(theme.includes('@keyframes weeklyBarGrow'));
  assert.ok(theme.includes('@keyframes weeklyRowReveal'));
  assert.ok(theme.includes('.checkpoint-trajectory.is-chart-visible .weekly-reopening-groups article > i > em'));
  assert.ok(theme.includes('.episode-evidence-strip.is-chart-visible .episode-track i'));
  assert.ok(journey.includes('six-days-journey-state'));
});
