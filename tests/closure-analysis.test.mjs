import test from "node:test";
import assert from "node:assert/strict";
import {buildClosureEpisodes,eventId,groupInspectionRows,matchCohort,recurrenceAnalysis,snapshotChanges,timelineAnalysis,transitionAnalysis} from "../lib/closure-analysis.ts";

const row=(camis,date,action,code,extra={})=>({camis,dba:`Restaurant ${camis}`,boro:"Manhattan",building:"10",street:"Main St",zipcode:"10001",inspection_date:`${date}T00:00:00.000`,inspection_type:"Cycle Inspection / Initial Inspection",action,violation_code:code,violation_description:`Violation ${code}`,critical_flag:code==="A"?"Critical":"Not Critical",score:"30",latitude:"40.75",longitude:"-73.99",...extra});
const closed="Establishment Closed by DOHMH";const reopened="Establishment re-opened by DOHMH";

test("raw violation rows combine into one event",()=>{const events=groupInspectionRows([row("1","2025-01-01",closed,"A"),row("1","2025-01-01",closed,"B")]);assert.equal(events.length,1);assert.deepEqual(events[0].codes.map(c=>c.code),["A","B"])});
test("event and episode IDs are deterministic",()=>{const r=row("1","2025-01-01",closed,"A");assert.equal(eventId(r),eventId({...r}));const a=buildClosureEpisodes(groupInspectionRows([r]))[0];const b=buildClosureEpisodes(groupInspectionRows([{...r}]))[0];assert.equal(a.id,b.id)});
test("two closures before one reopening create one episode",()=>{const events=groupInspectionRows([row("1","2025-01-01",closed,"A"),row("1","2025-01-03",closed,"B"),row("1","2025-01-06",reopened,"C")]);const episodes=buildClosureEpisodes(events);assert.equal(episodes.length,1);assert.equal(episodes[0].reopening?.date,"2025-01-06")});
test("a reopening is never reused",()=>{const events=groupInspectionRows([row("1","2025-01-01",closed,"A"),row("1","2025-01-06",reopened,"C"),row("1","2025-02-01",closed,"A")]);const episodes=buildClosureEpisodes(events);assert.equal(episodes.length,2);assert.equal(episodes.filter(e=>e.reopening).length,1)});
test("unmatched closure remains censored",()=>{const episode=buildClosureEpisodes(groupInspectionRows([row("1","2025-01-01",closed,"A")]))[0];assert.equal(episode.reopening,null);assert.equal(episode.reopeningDays,null)});

function fixtures(){return buildClosureEpisodes(groupInspectionRows([
  row("1","2025-01-01",closed,"A"),row("1","2025-01-01",closed,"B"),row("1","2025-01-06",reopened,"B"),row("1","2026-02-10",closed,"A"),
  row("2","2025-01-02",closed,"A"),row("2","2025-01-02",closed,"B"),row("2","2025-01-10",reopened,"C"),row("2","2026-03-01",closed,"A"),
  row("3","2025-01-02",closed,"D",{boro:"Queens",zipcode:"11368"}),row("3","2025-01-20",reopened,"D",{boro:"Queens",zipcode:"11368"}),
  row("4","2026-07-01",closed,"A"),
]))}

test("selected episode is excluded from cohort",()=>{const all=fixtures();const selected=all.find(e=>e.camis==="1");const cohort=matchCohort(selected,all,{scope:"city",burdenTolerance:2,periodYears:2,inspectionType:true,minSharedCodes:1});assert.ok(!cohort.some(e=>e.id===selected.id))});
test("geography filter works",()=>{const all=fixtures();const selected=all.find(e=>e.camis==="1");const zip=matchCohort(selected,all,{scope:"zip",burdenTolerance:5,periodYears:4,inspectionType:true,minSharedCodes:1});assert.ok(zip.every(e=>e.zipcode==="10001"))});
test("violation, burden, type and period filters combine",()=>{const all=fixtures();const selected=all.find(e=>e.camis==="1");const cohort=matchCohort(selected,all,{scope:"city",burdenTolerance:0,periodYears:1,inspectionType:true,minSharedCodes:2});assert.ok(cohort.every(e=>e.closure.codes.length===selected.closure.codes.length))});
test("transition analysis uses cohort and classifies code changes",()=>{const result=transitionAnalysis(fixtures().filter(e=>e.camis==="1"||e.camis==="2"));const a=result.codes.find(c=>c.code==="A");const b=result.codes.find(c=>c.code==="B");const c=result.codes.find(c=>c.code==="C");assert.equal(a.absent,2);assert.equal(b.remained,1);assert.equal(c.appeared,1)});
test("recurrence reports numerator denominator and eligibility",()=>{const result=recurrenceAnalysis(fixtures(),"2026-08-08",365);assert.ok(result.eligible>=2);assert.ok(result.reclosed<=result.eligible);assert.equal(result.rate,result.eligible?result.reclosed/result.eligible*100:0)});
test("five-day closure is excluded from every threshold",()=>{const recent=buildClosureEpisodes(groupInspectionRows([row("9","2026-08-03",closed,"A")]));const result=timelineAnalysis(recent,"2026-08-08");assert.deepEqual(result.thresholds.map(t=>t.eligible),[0,0,0])});
test("20-day closure is eligible at 7 and 14 but not 30",()=>{const recent=buildClosureEpisodes(groupInspectionRows([row("9","2026-07-19",closed,"A")]));const result=timelineAnalysis(recent,"2026-08-08");assert.deepEqual(result.thresholds.map(t=>t.eligible),[1,1,0])});
test("timeline uses only supplied retained cohort",()=>{const all=fixtures();const retained=all.filter(e=>e.camis==="2");const result=timelineAnalysis(retained,"2026-08-08");assert.equal(result.total,retained.length)});
test("snapshot without a prior value is latest-record mode",()=>{assert.equal(snapshotChanges(null,groupInspectionRows([row("1","2025-01-01",closed,"A")])),null)});
test("snapshot reports added or changed events",()=>{const before=groupInspectionRows([row("1","2025-01-01",closed,"A")]);const after=groupInspectionRows([row("1","2025-01-01",closed,"A"),row("1","2025-01-06",reopened,"B")]);assert.equal(snapshotChanges(before,after)?.length,1)});
