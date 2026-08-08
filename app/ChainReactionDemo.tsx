"use client";

import { useMemo, useState } from "react";

type Restaurant = { camis:string; name:string; borough:string; closureDate:string; reopeningDate:string|null; reopeningDays:number|null; codes:Array<{code:string;description:string}>; laterClosureCount:number };
type Benchmark = { borough:string; closureDate:string; reopeningDays:number|null; codes:string[] };
type Repeat = { code:string; description:string; repeatedCount:number; repeatRate:number };

const stages = [
  ["Closure record","Why was this restaurant closed?"],
  ["Comparable cases","What happened to similar closures?"],
  ["Reopening change","What changed when they reopened?"],
  ["Repeat closures","Which recorded conditions returned?"],
  ["Historical timeline","How long did comparable cases take?"],
  ["Live record","What could NYC record next?"],
] as const;

function median(values:number[]) { const a=[...values].sort((x,y)=>x-y); if(!a.length)return null; const m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2; }

export function ChainReactionDemo({sample,benchmarks,repeats}:{sample:Restaurant;benchmarks:Benchmark[];repeats:Repeat[]}) {
  const [stage,setStage]=useState(0);
  const comparable=useMemo(()=>benchmarks.filter(item=>item.borough===sample.borough&&item.codes.some(code=>sample.codes.some(v=>v.code===code))),[benchmarks,sample]);
  const days=comparable.flatMap(item=>item.reopeningDays===null?[]:[item.reopeningDays]);
  const med=median(days);
  const repeated=repeats.filter(item=>sample.codes.some(code=>code.code===item.code)).slice(0,3);
  const retained=[
    `${sample.codes.length} closure violations`,
    `${comparable.length} comparable ${sample.borough} cases`,
    sample.reopeningDays===null?"No reopening recorded":`${sample.reopeningDays}-day recorded reopening`,
    repeated.length?`${repeated.length} matched repeat-code patterns`:"No matched repeat-code pattern",
    med===null?"Timeline unavailable":`${med}-day comparison median`,
    "Ready for the next public update",
  ];

  return <div className="chain-demo">
    <div className="sample-banner"><span>TEST CASE · LIVE PUBLIC RECORD</span><strong>{sample.name}</strong><p>{sample.borough} · CAMIS {sample.camis} · closed {sample.closureDate}</p></div>
    <div className="demo-chain" role="tablist" aria-label="Restaurant evidence journey">{stages.map(([title,question],index)=><button key={title} role="tab" aria-selected={stage===index} className={stage===index?"active":index<stage?"complete":""} onClick={()=>setStage(index)}><span>{String(index+1).padStart(2,"0")}</span><strong>{title}</strong><small>{question}</small>{index<5&&<i>→</i>}</button>)}</div>
    <div className="accumulator"><div className="accumulator-head"><span>Evidence carried forward</span><strong>{stage+1} of 6 stages</strong></div><div className="evidence-chips">{retained.slice(0,stage+1).map((item,index)=><span key={item}><b>{index+1}</b>{item}</span>)}</div></div>
    <div className="stage-output" aria-live="polite">
      {stage===0&&<><p className="output-kicker">CONCRETE RECORD</p><h3>{sample.codes.length} violations were recorded at closure.</h3><div className="output-codes">{sample.codes.slice(0,5).map(item=><span key={item.code}><code>{item.code}</code>{item.description}</span>)}</div></>}
      {stage===1&&<><p className="output-kicker">COMPARISON ADDED</p><h3>{comparable.length} closures share this borough and at least one recorded violation code.</h3><p>The comparison retains the original closure evidence and adds geographic and violation context.</p></>}
      {stage===2&&<><p className="output-kicker">REOPENING EVENT ADDED</p><h3>{sample.reopeningDate?`A reopening was recorded ${sample.reopeningDays} days later.`:"No later reopening is currently matched."}</h3><p>{sample.reopeningDate?`Closure ${sample.closureDate} → reopening ${sample.reopeningDate}. The record shows the transition, not the repairs performed.`:"The public sequence remains incomplete, so no change is inferred."}</p></>}
      {stage===3&&<><p className="output-kicker">RECURRENCE EVIDENCE ADDED</p><h3>{repeated.length?"Some closure codes also appear in citywide repeat-closure patterns.":"No strong repeat-code match appears for this sample."}</h3><div className="output-codes">{repeated.map(item=><span key={item.code}><code>{item.code}</code>{item.repeatRate.toFixed(0)}% repeated in eligible repeat-closure records</span>)}</div></>}
      {stage===4&&<><p className="output-kicker">ACCUMULATED HISTORICAL TIMELINE</p><h3>{med===null?"Not enough matched cases for a timeline.":`The comparison median is ${med} days.`}</h3><div className="mini-timeline">{[7,14,30].map(limit=>{const eligible=comparable.filter(x=>x.reopeningDays===null||x.reopeningDays>limit).length;return <span key={limit}><strong>{comparable.length?`${(eligible/comparable.length*100).toFixed(0)}%`:"—"}</strong>without a recorded reopening by day {limit}</span>})}</div></>}
      {stage===5&&<><p className="output-kicker">LIVE RECORD WATCH</p><h3>The accumulated case is ready for the next official event.</h3><p>Six Days can compare a newly recorded inspection, action, violation, grade, reopening, or later closure with every earlier stage above.</p></>}
    </div>
    <div className="demo-controls"><button disabled={stage===0} onClick={()=>setStage(stage-1)}>← Previous</button><button disabled={stage===5} onClick={()=>setStage(stage+1)}>Add next stage →</button></div>
  </div>;
}
