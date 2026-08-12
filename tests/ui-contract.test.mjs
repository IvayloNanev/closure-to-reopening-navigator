import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const journey=await readFile(new URL("../app/ConnectedJourney.tsx",import.meta.url),"utf8");
const chapters=await readFile(new URL("../app/BookChapters.tsx",import.meta.url),"utf8");
const theme=await readFile(new URL("../app/theme.css",import.meta.url),"utf8");

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

test("comparison evidence is integrated into the planning range",()=>{
  assert.ok(journey.includes('What supports this range:'));
  assert.ok(!journey.includes('WHY THESE RESTAURANTS WERE COMPARED'));
});

test("violation evidence appears before financial planning",()=>{
  assert.ok(theme.indexOf('.comparison-results-page > .violation-paths { order: 8; }') < theme.indexOf('.comparison-results-page > .scenario-calculator { order: 9; }'));
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
  assert.ok(theme.includes('.journey-page:not([hidden]) > .book-chapter'));
  assert.ok(theme.includes('animation: originalBookPageOpen'));
  assert.ok(theme.includes('@keyframes originalBookPageOpen'));
  assert.ok(theme.includes('@keyframes originalBookPageOpenRight'));
  assert.ok(chapters.includes('currentPage.animate'));
  assert.ok(theme.includes('view-transition-name: journey-page'));
  assert.ok(theme.includes('@keyframes turnPageForward'));
  assert.ok(theme.includes('@keyframes turnPageBackward'));
  assert.match(theme,/prefers-reduced-motion:[\s\S]*\.journey-page:not\(\[hidden\]\)/);
});

test("bar and line charts animate as evidence is revealed",()=>{
  assert.ok(journey.includes('function ChartViewportObserver'));
  assert.ok(journey.includes('IntersectionObserver'));
  assert.ok(journey.includes('is-chart-visible'));
  assert.ok(theme.includes('@keyframes chartBarGrow'));
  assert.ok(theme.includes('@keyframes trendLineDraw'));
  assert.ok(theme.includes('@keyframes trendPointReveal'));
  assert.ok(theme.includes('.planning-distribution-bars article i b'));
  assert.ok(theme.includes('.trend-segment.second'));
});
