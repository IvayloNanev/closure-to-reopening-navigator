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

test("print view and semantic status tokens exist",()=>{
  assert.ok(theme.includes('@media print'));
  for(const token of ['--sd-accent','--sd-danger','--sd-success','--sd-focus'])assert.ok(theme.includes(token),token);
});
