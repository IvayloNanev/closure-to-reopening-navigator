"use client";

import { useMemo, useState } from "react";

type Restaurant={camis:string;name:string;borough:string;closureDate:string;reopeningDate:string|null;reopeningDays:number|null;codes:Array<{code:string;description:string}>;laterClosureCount:number};
type Benchmark={borough:string;closureDate:string;reopeningDays:number|null;codes:string[]};
type Repeat={code:string;description:string;repeatedCount:number;repeatRate:number};

function median(values:number[]){const a=[...values].sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function pct(n:number,d:number){return d?`${(n/d*100).toFixed(0)}%`:"—"}

export function OwnerWizard({restaurants,benchmarks,repeats}:{restaurants:Restaurant[];benchmarks:Benchmark[];repeats:Repeat[]}){
  const sample=restaurants.find(r=>r.reopeningDays!==null&&r.codes.length>=3)??restaurants[0];
  const [restaurant,setRestaurant]=useState<Restaurant|null>(null);
  const [step,setStep]=useState(0);
  const [query,setQuery]=useState("");
  const matches=useMemo(()=>query.trim().length<2?[]:restaurants.filter(r=>`${r.name} ${r.camis}`.toLowerCase().includes(query.toLowerCase())).slice(0,5),[query,restaurants]);
  const comparable=useMemo(()=>restaurant?benchmarks.filter(b=>b.borough===restaurant.borough&&b.codes.some(code=>restaurant.codes.some(v=>v.code===code))):[],[restaurant,benchmarks]);
  const matchedDays=comparable.flatMap(b=>b.reopeningDays===null?[]:[b.reopeningDays]);
  const med=median(matchedDays);
  const repeatMatches=restaurant?repeats.filter(r=>restaurant.codes.some(v=>v.code===r.code)).slice(0,4):[];
  const steps=["My closure","Similar cases","Reopening change","Repeat closures","Timeline","Live record"];
  const choose=(r:Restaurant)=>{setRestaurant(r);setQuery(r.name);setStep(1)};
  const restart=()=>{setRestaurant(null);setQuery("");setStep(0)};

  return <main className="wizard-page">
    <header className="wizard-header"><button className="wizard-brand" onClick={restart}>Six Days</button><div className="wizard-progress">{steps.map((label,index)=><button key={label} className={index===step?"active":index<step?"done":""} disabled={!restaurant&&index>0} onClick={()=>restaurant&&setStep(index)}><b>{index+1}</b><span>{label}</span></button>)}</div><span className="live-dot"><i/> NYC OPEN DATA</span></header>
    <div className="wizard-viewport"><div className="wizard-track" style={{transform:`translateX(-${step*100}%)`}}>
      <section className="wizard-card welcome-card" aria-hidden={step!==0}><div className="wizard-six">6</div><div className="wizard-copy"><p className="wizard-kicker">RESTAURANT CLOSURE NAVIGATOR</p><h1>Six Days</h1><h2>Start with your restaurant.</h2><p>Understand the closure record, compare similar cases, see what changed at reopening, learn from repeat closures, and build a historical timeline.</p><div className="wizard-search"><label htmlFor="wizard-search">Find my restaurant</label><input id="wizard-search" placeholder="Restaurant name or CAMIS" value={query} onChange={e=>setQuery(e.target.value)} autoComplete="off"/>{matches.length>0&&<div className="wizard-matches">{matches.map(r=><button key={`${r.camis}-${r.closureDate}`} onClick={()=>choose(r)}><strong>{r.name}</strong><span>{r.borough} · CAMIS {r.camis}</span></button>)}</div>}</div><div className="or-line"><span>or</span></div><button className="sample-button" disabled={!sample} onClick={()=>sample&&choose(sample)}>Load sample restaurant <span>→</span></button></div></section>

      <Card step={1} current={step} eyebrow="01 · OFFICIAL CLOSURE RECORD" title="Why was this restaurant closed?" restaurant={restaurant}><div className="fact-grid"><Fact label="Restaurant" value={restaurant?.name}/><Fact label="Closed" value={restaurant?.closureDate}/><Fact label="Borough" value={restaurant?.borough}/><Fact label="CAMIS" value={restaurant?.camis}/></div><h3>Violations recorded at closure</h3><div className="wizard-codes">{restaurant?.codes.slice(0,6).map(v=><span key={v.code}><code>{v.code}</code>{v.description}</span>)}</div></Card>
      <Card step={2} current={step} eyebrow="02 · COMPARABLE CASES" title="What happened to similar closures?" restaurant={restaurant}><p className="result-sentence"><strong>{comparable.length}</strong> {restaurant?.borough} closure records share at least one of this restaurant’s violation codes.</p><div className="fact-grid"><Fact label="Matched reopenings" value={matchedDays.length.toString()}/><Fact label="Comparison median" value={med===null?"—":`${med} days`}/><Fact label="Still unmatched" value={(comparable.length-matchedDays.length).toString()}/></div></Card>
      <Card step={3} current={step} eyebrow="03 · REOPENING CHANGE" title="What changed when reopening was recorded?" restaurant={restaurant}><div className="event-pair"><article><span>CLOSURE</span><strong>{restaurant?.closureDate}</strong><p>{restaurant?.codes.length} recorded violation codes</p></article><i>→</i><article><span>NEXT REOPENING</span><strong>{restaurant?.reopeningDate??"Not recorded"}</strong><p>{restaurant?.reopeningDays===null?"No matched transition":`${restaurant?.reopeningDays} elapsed days`}</p></article></div><p className="data-boundary">The public record shows the event transition. It does not show which repairs or services were performed.</p></Card>
      <Card step={4} current={step} eyebrow="04 · REPEAT CLOSURES" title="Which recorded conditions appeared again?" restaurant={restaurant}><p className="result-sentence"><strong>{repeatMatches.length}</strong> codes from this closure match the strongest repeat-closure patterns in the current analysis.</p><div className="repeat-table">{repeatMatches.length?repeatMatches.map(r=><article key={r.code}><code>{r.code}</code><span>{r.description}</span><strong>{r.repeatRate.toFixed(0)}%</strong></article>):<p>No repeat-pattern match was available for this case.</p>}</div></Card>
      <Card step={5} current={step} eyebrow="05 · ACCUMULATED TIMELINE" title="How long did comparable cases take?" restaurant={restaurant}><div className="timeline-answer"><strong>{med??"—"}</strong><span>median recorded days<br/>among matched comparable cases</span></div><div className="thresholds">{[7,14,30].map(day=><article key={day}><strong>{pct(comparable.filter(b=>b.reopeningDays===null||b.reopeningDays>day).length,comparable.length)}</strong><span>without a recorded reopening by day {day}</span></article>)}</div><p className="data-boundary">Built from the restaurant, borough, violation match, reopening transition, and historical comparison carried through the earlier cards.</p></Card>
      <Card step={6} current={step} eyebrow="06 · LIVE RECORD" title="What will the public record show next?" restaurant={restaurant}><div className="watch-list">{["New inspection date or type","Changed closure or reopening action","New, repeated, or absent violation code","Grade or grade-date update","Later recorded closure"].map((x,i)=><span key={x}><b>{i+1}</b>{x}</span>)}</div><p className="data-boundary">Six Days monitors observable dataset changes. It does not predict or authorize an outcome.</p></Card>
    </div></div>
    {step>0&&<footer className="wizard-footer"><button onClick={()=>setStep(step-1)}>← Back</button><div><strong>{restaurant?.name}</strong><span>{restaurant?.codes.length} violations · {comparable.length} comparable cases · {med??"—"}-day median</span></div>{step<6?<button className="next-card" onClick={()=>setStep(step+1)}>Next card →</button>:<button className="next-card" onClick={restart}>Start again</button>}</footer>}
  </main>
}

function Card({step,current,eyebrow,title,restaurant,children}:{step:number;current:number;eyebrow:string;title:string;restaurant:Restaurant|null;children:React.ReactNode}){return <section className="wizard-card data-card" aria-hidden={current!==step}><div className="card-shell"><div className="card-heading"><div><p className="wizard-kicker">{eyebrow}</p><h2>{title}</h2></div><span>{restaurant?.name}</span></div>{children}</div></section>}
function Fact({label,value}:{label:string;value?:string}){return <article><span>{label}</span><strong>{value??"—"}</strong></article>}
