"use client";

import { useEffect, useMemo, useState } from "react";
import { groupInspectionRows, matchCohort, recurrenceAnalysis, timelineAnalysis, transitionAnalysis, type ClosureEpisode, type CohortFilters, type InspectionEvent, type RawInspectionRow } from "../lib/closure-analysis";
import type { BoroughMapPath } from "../lib/inspections";

const labels=["Find","Compare","Reopening","Repeat closure","Timeline","Latest record"];
const nextLabels=["Compare this closure","Use these comparable cases","Follow reopened cases","Build my timeline","Check my latest record","Start again"];
const fmt=new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"});

export function OwnerWizard({episodes,events,boroughMap,fetchedAt}:{episodes:ClosureEpisode[];events:InspectionEvent[];boroughMap:BoroughMapPath[];fetchedAt:string}){
  const sample=useMemo(()=>episodes.find(e=>e.reopening&&e.closure.codes.length>=3&&matchCohort(e,episodes,{scope:"borough",burdenTolerance:2,periodYears:2,inspectionType:true,minSharedCodes:1}).length>=10)??episodes.find(e=>e.reopening&&e.closure.codes.length>=3)??episodes[0],[episodes]);
  const [selected,setSelected]=useState<ClosureEpisode|null>(null);const [step,setStep]=useState(0);const [query,setQuery]=useState("");
  const [filters,setFilters]=useState<CohortFilters>({scope:"borough",burdenTolerance:2,periodYears:2,inspectionType:true,minSharedCodes:1});
  const [retainedIds,setRetainedIds]=useState<string[]>([]);const [latestEvents,setLatestEvents]=useState<InspectionEvent[]>([]);
  const matches=useMemo(()=>{const q=query.trim().toLowerCase();return q.length<2?[]:episodes.filter(e=>`${e.name} ${e.camis} ${e.address} ${e.zipcode}`.toLowerCase().includes(q)).slice(0,6)},[query,episodes]);
  const candidate=useMemo(()=>selected?matchCohort(selected,episodes,filters):[],[selected,episodes,filters]);
  const retained=useMemo(()=>{const ids=new Set(retainedIds);return episodes.filter(e=>ids.has(e.id))},[episodes,retainedIds]);
  const transitions=useMemo(()=>transitionAnalysis(retained),[retained]);const recurrence=useMemo(()=>recurrenceAnalysis(retained,fetchedAt.slice(0,10)),[retained,fetchedAt]);const timeline=useMemo(()=>timelineAnalysis(retained,fetchedAt.slice(0,10)),[retained,fetchedAt]);
  const restaurantEvents=useMemo(()=>{const source=latestEvents.length?latestEvents:events;return selected?source.filter(e=>e.camis===selected.camis).sort((a,b)=>b.date.localeCompare(a.date)):[]},[events,latestEvents,selected]);
  useEffect(()=>{if(!selected)return;let cancelled=false;const params=new URLSearchParams({"$select":"camis,dba,boro,building,street,zipcode,inspection_date,inspection_type,action,violation_code,violation_description,critical_flag,score,grade,grade_date,record_date,latitude,longitude","$where":`camis='${selected.camis}'`,"$order":"inspection_date DESC","$limit":"50000"});fetch(`https://data.cityofnewyork.us/resource/43nn-pn8j.json?${params}`).then(r=>r.json()).then((rows:RawInspectionRow[])=>{if(!cancelled)setLatestEvents(groupInspectionRows(rows))}).catch(()=>{});return()=>{cancelled=true}},[selected]);
  const choose=(episode:ClosureEpisode)=>{setSelected(episode);setQuery(episode.name);setRetainedIds([]);setStep(0)};
  const next=()=>{if(step===0&&selected)setStep(1);else if(step===1){setRetainedIds(candidate.map(e=>e.id));setStep(2)}else if(step<5)setStep(step+1);else{setSelected(null);setQuery("");setRetainedIds([]);setStep(0)}};
  const canNext=step===0?!!selected:step===1?candidate.length>0:true;

  return <main className="wizard-page">
    <header className="wizard-header"><button className="wizard-brand" onClick={()=>setStep(0)}>Six Days</button><div className="wizard-progress">{labels.map((label,i)=><button key={label} className={i===step?"active":i<step?"done":""} disabled={i>step||(!selected&&i>0)} onClick={()=>i<=step&&setStep(i)}><b>{i+1}</b><span>{label}</span></button>)}</div><span className="live-dot"><i/> NYC OPEN DATA</span></header>
    <div className="wizard-viewport"><div className="wizard-track" style={{transform:`translateX(-${step*100}%)`}}>
      <Stage current={step} index={0}><div className="page-one"><div><p className="wizard-kicker">NYC RESTAURANT CLOSURE NAVIGATOR</p><h1>Six Days</h1><h2>Find my restaurant.</h2><div className="wizard-search"><input aria-label="Restaurant name, CAMIS, address, or ZIP" placeholder="Name, CAMIS, address, or ZIP" value={query} onChange={e=>setQuery(e.target.value)} />{matches.length>0&&query!==selected?.name&&<div className="wizard-matches">{matches.map(e=><button key={e.id} onClick={()=>choose(e)}><strong>{e.name}</strong><span>{e.address} · {e.closure.date} · CAMIS {e.camis}</span></button>)}</div>}</div><button className="sample-button" onClick={()=>sample&&choose(sample)}>Load sample restaurant <span>→</span></button></div>{selected?<ClosureRecord episode={selected}/>:<div className="empty-record"><span>01</span><strong>Select a restaurant</strong><p>Its official closure evidence will appear here before you continue.</p></div>}</div></Stage>

      <Stage current={step} index={1}><div className="card-shell">
        <Heading kicker="02 · COMPARABLE CLOSURES" title="What happened to restaurants like mine?" name={selected?.name}/>
        <div className="compare-layout"><div>
          <div className="scope-switch">{(["zip","borough","city"] as const).map(scope=><button key={scope} className={filters.scope===scope&&!filters.boroughOverride?"active":""} onClick={()=>setFilters({...filters,scope,boroughOverride:undefined})}>{scope==="zip"?`ZIP ${selected?.zipcode}`:scope==="borough"?selected?.borough:"All NYC"}</button>)}{filters.boroughOverride&&<button className="active">{filters.boroughOverride}</button>}</div>
          <div className="filter-row"><label>Burden ± <input type="number" min="0" max="8" value={filters.burdenTolerance} onChange={e=>setFilters({...filters,burdenTolerance:Number(e.target.value)})}/></label><label>Period <select value={filters.periodYears} onChange={e=>setFilters({...filters,periodYears:Number(e.target.value)})}><option value="1">1 year</option><option value="2">2 years</option><option value="4">4 years</option></select></label><label><input type="checkbox" checked={filters.inspectionType} onChange={e=>setFilters({...filters,inspectionType:e.target.checked})}/> Same inspection type</label></div>
          <div className="cohort-facts"><Fact label="Candidate cases" value={candidate.length}/><Fact label="Matched reopenings" value={candidate.filter(e=>e.reopening).length}/><Fact label="No reopening matched" value={candidate.filter(e=>!e.reopening).length}/></div>
          <p className="criteria-copy">Shared code ≥ {filters.minSharedCodes} · burden within ±{filters.burdenTolerance} · {filters.inspectionType?"same inspection type":"any inspection type"} · {filters.periodYears}-year window</p>{candidate.length<30&&<p className="sample-warning">Small sample: widen geography or criteria before retaining this cohort.</p>}
        </div><CohortMap paths={boroughMap} episodes={candidate} selected={selected} onBorough={borough=>setFilters({...filters,scope:"borough",boroughOverride:borough})}/></div>
        <details className="case-inspector"><summary>Inspect {candidate.length} candidate cases</summary><div>{candidate.slice(0,12).map(e=><span key={e.id}>{e.name} · {e.borough} · {e.closure.date} · {e.closure.codes.length} codes</span>)}</div></details>
      </div></Stage>

      <Stage current={step} index={2}><div className="card-shell"><Heading kicker="03 · REOPENING CHANGES" title="Which recorded violations disappeared, remained, or appeared?" name={`${transitions.eligible} eligible transitions`}/><div className="analysis-summary"><Fact label="Retained cohort" value={retained.length}/><Fact label="Matched reopenings" value={transitions.eligible}/><Fact label="Cohort locked" value="Page 2 IDs"/></div><div className="transition-table"><div><b>CODE</b><b>ABSENT</b><b>REMAINED</b><b>APPEARED</b></div>{transitions.codes.slice(0,7).map(row=><div key={row.code}><code>{row.code}</code><span>{row.absent} · {pct(row.absent,transitions.eligible)}</span><span>{row.remained} · {pct(row.remained,transitions.eligible)}</span><span>{row.appeared} · {pct(row.appeared,transitions.eligible)}</span></div>)}</div><p className="data-boundary">Absence from the next public record does not identify the repair performed or prove that a specific service caused reopening.</p></div></Stage>

      <Stage current={step} index={3}><div className="card-shell"><Heading kicker="04 · REPEAT-CLOSURE PATTERNS" title="Which recorded violations appeared again?" name="365-day follow-up"/><div className="analysis-summary"><Fact label="Retained" value={recurrence.retained}/><Fact label="Reopened" value={recurrence.reopened}/><Fact label="Eligible for 365 days" value={recurrence.eligible}/><Fact label="Closed again" value={`${recurrence.reclosed} · ${recurrence.rate.toFixed(1)}%`}/></div><div className="repeat-table">{recurrence.codes.slice(0,6).map(row=><article key={row.code}><code>{row.code}</code><span>Repeated at a later closure</span><strong>{row.count}/{recurrence.reclosed} · {row.rate.toFixed(0)}%</strong></article>)}</div><p className="data-boundary">Percentages use only reopened cases observable for the full follow-up horizon. Recurrence is historical evidence, not a prediction.</p></div></Stage>

      <Stage current={step} index={4}><div className="card-shell"><Heading kicker="05 · HISTORICAL TIMELINE" title="How long did the retained cases take?" name={`${retained.length} exact cohort IDs`}/><div className="timeline-answer"><strong>{timeline.median??"—"}</strong><span>median recorded days<br/>among {timeline.matched} matched reopenings</span></div><div className="thresholds">{timeline.thresholds.map(t=><article key={t.days}><strong>{t.rate.toFixed(1)}%</strong><span>without a recorded reopening by day {t.days}<br/>n={t.without}/{t.eligible} eligible</span></article>)}</div><div className="distribution-line">{["0–3","4–7","8–14","15–30","31+"].map((label,i)=>{const ranges=[[0,3],[4,7],[8,14],[15,30],[31,Infinity]][i];const count=timeline.values.filter(v=>v>=ranges[0]&&v<=ranges[1]).length;return <span key={label}><i style={{height:`${Math.max(5,count/Math.max(1,timeline.values.length)*100)}%`}}/><b>{count}</b><small>{label} days</small></span>})}</div><p className="data-boundary">Recent closures enter each threshold only after enough observable time has elapsed. This is a historical benchmark, not a predicted reopening date.</p></div></Stage>

      <Stage current={step} index={5}><div className="card-shell"><Heading kicker="06 · LATEST OFFICIAL RECORD" title="What does NYC currently record for my restaurant?" name={selected?.name}/><div className="analysis-summary"><Fact label="Latest event" value={restaurantEvents[0]?.date??"—"}/><Fact label="Latest action" value={restaurantEvents[0]?.action??"—"}/><Fact label="Score" value={restaurantEvents[0]?.score??"—"}/><Fact label="Grade" value={restaurantEvents[0]?.grade??"Not recorded"}/><Fact label="Dataset fetched" value={fmt.format(new Date(fetchedAt))}/></div><div className="latest-events">{restaurantEvents.slice(0,6).map(event=><article key={event.id}><time>{event.date}</time><div><strong>{event.action}</strong><span>{event.inspectionType} · {event.codes.length} violation codes{event.grade?` · grade ${event.grade}`:""}</span></div></article>)}</div><p className="data-boundary">This is the latest official record, not change monitoring. NYC Open Data may lag operational events and does not replace direct DOHMH communication.</p></div></Stage>
    </div></div>
    <footer className="wizard-footer"><button disabled={step===0} onClick={()=>setStep(step-1)}>← Back</button><div><strong>{selected?.name??"Select a restaurant"}</strong><span>{step>1?`${retained.length} retained cohort IDs`:"Evidence is carried forward only after confirmation"}</span></div><button className="next-card" disabled={!canNext} onClick={next}>{nextLabels[step]} →</button></footer>
  </main>
}

function Stage({current,index,children}:{current:number;index:number;children:React.ReactNode}){return <section className="wizard-card" aria-hidden={current!==index}>{children}</section>}
type HelpBriefContent={data:string;analysis:string;learning:string;effect:string;next:string};
const helpBriefs:Record<string,HelpBriefContent>={
  "01 · OFFICIAL CLOSURE RECORD":{
    data:"Your restaurant’s official action, inspection date, score, inspection type, violation codes, and critical flags.",
    analysis:"Build one closure profile from the official inspection record.",
    learning:"Why was my restaurant closed, according to NYC Open Data?",
    effect:"The record helps you organize attention and resources around the problems officially documented in your case.",
    next:"Use this closure profile to find comparable NYC restaurants.",
  },
  "02 · COMPARABLE CLOSURES":{
    data:"Shared violation codes, violation burden, inspection type, time period, and geography.",
    analysis:"Match your closure with similar NYC cases and retain one confirmed comparison group.",
    learning:"What happened to restaurants with closure records similar to mine?",
    effect:"A relevant comparison group provides more useful context than a single citywide average when evaluating your situation.",
    next:"Carry these exact restaurant IDs forward to examine their recorded reopenings.",
  },
  "03 · REOPENING CHANGES":{
    data:"Each retained restaurant’s closure record and its next recorded reopening event.",
    analysis:"Compare violation codes to identify which disappeared, remained, or appeared at reopening.",
    learning:"What changed in the public records of comparable restaurants before reopening was recorded?",
    effect:"Commonly remaining codes identify areas that may deserve closer review before your next inspection. The data does not reveal which repairs or services caused reopening.",
    next:"Follow the same reopened restaurants to determine which recorded problems appeared again.",
  },
  "04 · REPEAT-CLOSURE PATTERNS":{
    data:"The retained restaurants’ reopening records and later recorded closures during an observable 365-day period.",
    analysis:"Identify later closures and count which violation codes appeared again.",
    learning:"Which recorded problems recurred among comparable restaurants after reopening?",
    effect:"Recurring categories indicate areas that may warrant continued operational attention after reopening, but they do not predict that your restaurant will close again.",
    next:"Use the same retained cohort to calculate the historical reopening timeline.",
  },
  "05 · HISTORICAL TIMELINE":{
    data:"Recorded closure and reopening dates for the retained comparison group.",
    analysis:"Calculate elapsed days, the median, the distribution, and the percentage without a recorded reopening at each eligible threshold.",
    learning:"How long did comparable cases historically take to receive a recorded reopening?",
    effect:"The observed range can inform cash-flow, staffing, inventory, supplier, and communications planning. It is not a predicted reopening date.",
    next:"Return to your restaurant and check its newest official NYC record.",
  },
  "06 · LATEST OFFICIAL RECORD":{
    data:"The newest available NYC Open Data rows for the selected restaurant’s CAMIS identifier.",
    analysis:"Order the records by date and display the latest action, inspection, score, grade, and violation codes.",
    learning:"What does the public dataset currently show for my restaurant, and what has changed since the closure record?",
    effect:"The newest official evidence can help you identify what to verify next with DOHMH while retaining the comparison findings and historical timeline as context.",
    next:"This completes the chain. Restart the analysis to select another restaurant or refresh the available official record.",
  },
};
function HelpBrief({content,dark=false}:{content:HelpBriefContent;dark?:boolean}){const rows=[["Data",content.data],["Analysis",content.analysis],["You learn",content.learning],["Business effect",content.effect],["Next",content.next]];return <aside className={`help-brief${dark?" help-brief-dark":""}`} aria-label="How this helps you"><h3>How this helps you</h3><dl>{rows.map(([label,copy])=><div key={label}><dt>{label}</dt><dd>{copy}</dd></div>)}</dl></aside>}
function Heading({kicker,title,name}:{kicker:string;title:string;name?:string}){return <div className="card-heading"><div><p className="wizard-kicker">{kicker}</p><h2>{title}</h2><HelpBrief content={helpBriefs[kicker]}/></div><span>{name}</span></div>}
function Fact({label,value}:{label:string;value:string|number|null}){return <article><span>{label}</span><strong>{value??"—"}</strong></article>}
function pct(n:number,d:number){return d?`${(n/d*100).toFixed(0)}%`:"—"}
function ClosureRecord({episode}:{episode:ClosureEpisode}){return <div className="closure-panel"><p className="wizard-kicker">01 · OFFICIAL CLOSURE RECORD</p><h2>{episode.name}</h2><p>{episode.address} · {episode.borough} {episode.zipcode}</p><HelpBrief content={helpBriefs["01 · OFFICIAL CLOSURE RECORD"]} dark/><div className="closure-facts"><Fact label="Action" value={episode.closure.action}/><Fact label="Date" value={episode.closure.date}/><Fact label="Score" value={episode.closure.score}/><Fact label="Critical flags" value={episode.closure.codes.filter(c=>c.critical).length}/><Fact label="Inspection" value={episode.closure.inspectionType}/><Fact label="Latest status" value={episode.reopening?"Reopened by DOHMH":"No reopening matched"}/></div><div className="compact-codes">{episode.closure.codes.slice(0,6).map(code=><span key={code.code}><code>{code.code}</code>{code.description}{code.critical&&<b>Critical</b>}</span>)}</div></div>}
function CohortMap({paths,episodes,selected,onBorough}:{paths:BoroughMapPath[];episodes:ClosureEpisode[];selected:ClosureEpisode|null;onBorough:(borough:string)=>void}){
  const count=(name:string)=>episodes.filter(e=>e.borough===name).length;
  return <div className="cohort-map"><svg viewBox="0 0 720 430" aria-label="NYC comparable closure map">
    {paths.map(path=><path key={path.name} d={path.path} fill={`hsl(42 55% ${82-Math.min(45,count(path.name)*2)}%)`} fillRule="evenodd" role="button" tabIndex={0} aria-label={`${path.name}: ${count(path.name)} candidate cases`} onClick={()=>onBorough(path.name)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")onBorough(path.name)}}/>)}
    {episodes.filter(e=>e.latitude!==null&&e.longitude!==null).slice(0,200).map(e=><circle key={e.id} cx={(e.longitude!+74.26)/.56*720} cy={(40.92-e.latitude!)/.43*430} r="2.4"/>)}
    {selected&&selected.latitude!==null&&selected.longitude!==null&&<circle className="selected-dot" cx={(selected.longitude+74.26)/.56*720} cy={(40.92-selected.latitude)/.43*430} r="7"/>}
  </svg><p>Gold dots show candidate cases. The red ring shows the selected restaurant.</p></div>
}
