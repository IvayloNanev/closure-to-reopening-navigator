"use client";

import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";

const closureLabels=["Start","Closure record","Build comparison","Plan + evidence","Manager summary"];
const inspectionLabels=["Start","Inspection record"];

export function BookChapters({children,unlockedThrough=1,initialActive=0,comparisonReady=false,comparisonBusy=false,noClosureJourney=false,onViewComparison}:{children:ReactNode;unlockedThrough?:number;initialActive?:number;comparisonReady?:boolean;comparisonBusy?:boolean;noClosureJourney?:boolean;onViewComparison?:()=>void}){
  const allPages=useMemo(()=>Children.toArray(children).filter(isValidElement) as ReactElement<{id?:string;className?:string}>[],[children]);
  const pages=useMemo(()=>noClosureJourney?allPages.filter(page=>page.props.id==="top"||page.props.id==="find"):allPages,[allPages,noClosureJourney]);
  const labels=noClosureJourney?inspectionLabels:closureLabels;
  const [active,setActive]=useState(initialActive);
  const [furthest,setFurthest]=useState(1);
  const [pageTurn,setPageTurn]=useState(0);
  const resetJourney=useCallback(()=>window.dispatchEvent(new Event("six-days-request-reset")),[]);
  const effectiveFurthest=Math.min(furthest,unlockedThrough);
  const go=useCallback((index:number,historyMode:"push"|"replace"="push")=>{
    const next=Math.max(0,Math.min(pages.length-1,index));
    const sequential=next===active+1&&next<=unlockedThrough;
    if(next>effectiveFurthest&&!sequential)return;
    setActive(next);
    setPageTurn(value=>value+1);
    setFurthest(value=>Math.max(value,next));
    const id=pages[next]?.props.id;
    if(id)history[historyMode==="push"?"pushState":"replaceState"](null,"",`#${id}`);
    window.requestAnimationFrame(()=>{
      window.scrollTo({top:0,behavior:"auto"});
      const heading=document.querySelector<HTMLElement>(`.journey-page:not([hidden]) [data-page-heading]`);
      heading?.focus();
      window.setTimeout(()=>window.dispatchEvent(new Event("six-days-page-turn-complete")),1080);
    });
  },[pages,active,effectiveFurthest,unlockedThrough]);
  useEffect(()=>{const selectEvent=(event:Event)=>{const index=pages.findIndex(page=>page.props.id===(event as CustomEvent<string>).detail);if(index>=0)go(index)};const reset=()=>{setActive(0);setFurthest(1);history.replaceState(null,"","#top");window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"auto"}))};const restore=()=>{const index=pages.findIndex(page=>`#${page.props.id}`===location.hash);if(index>=0&&index<=Math.min(furthest,unlockedThrough))go(index,"replace")};window.addEventListener("six-days-go-step",selectEvent);window.addEventListener("six-days-reset",reset);window.addEventListener("popstate",restore);return()=>{window.removeEventListener("six-days-go-step",selectEvent);window.removeEventListener("six-days-reset",reset);window.removeEventListener("popstate",restore)}},[pages,go,furthest,unlockedThrough]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent("six-days-journey-state",{detail:{active,furthest:effectiveFurthest}}))},[active,effectiveFurthest]);

  const blockedMessage=active===1?"Select a restaurant to continue":active===2?"Use the recommended records to continue":"Continue through this step to unlock the next";
  return <div className="guided-journey">
    <nav className="journey-rail" aria-label="Journey progress"><strong className="rail-title">{noClosureJourney?"YOUR RECORD REVIEW":"YOUR REOPENING JOURNEY"}</strong>{pages.map((page,index)=><div className="rail-stop" key={page.props.id??index}>{index>0&&<i className={index<=effectiveFurthest?"filled":""} aria-hidden="true"/>}<button data-step={index} type="button" className={index===active?"current":index<active?"complete":""} disabled={index>effectiveFurthest} onClick={()=>index===0&&active>0?resetJourney():go(index)} aria-label={index===0?"Start":`Step ${index}: ${labels[index]}`} aria-current={index===active?"step":undefined}><span>{index===0?"0":index}</span><small>{labels[index]}</small></button></div>)}</nav>
    <p className="mobile-step-status" aria-live="polite">{active===0?"Start":`Step ${active} of ${pages.length-1}`} · {labels[active]}</p><p className="visually-hidden" aria-live="assertive">{labels[active]}, {active===0?"start":`step ${active} of ${pages.length-1}`}</p>
    {pages.map((page,index)=><div className="journey-page fold-from-right-edge" key={page.props.id??index} hidden={index!==active}>{cloneElement(page,{key:index===active?`${page.props.id??index}-${pageTurn}`:page.props.id??index,className:`${page.props.className??""} guided-card is-visible`})}{index>0&&<div className="page-arrows"><button type="button" className="back-arrow" onClick={()=>index===1?resetJourney():go(index-1)}>← <span>{index===1?"Start":`Step ${index-1}`}</span></button>{page.props.id==="compare"?<div className="forward-wrap"><button type="button" className="forward-arrow view-comparison-nav" disabled={!comparisonReady||comparisonBusy} onClick={onViewComparison}><span>{comparisonBusy?"Opening…":noClosureJourney?"View available information":"View comparison"}</span> {comparisonBusy?"✓":"→"}</button>{!comparisonReady&&<small>Select an option and complete its required settings</small>}</div>:index<pages.length-1?<div className="forward-wrap"><button type="button" className="forward-arrow" disabled={index+1>unlockedThrough||index+1>furthest+1} onClick={()=>go(index+1)}><span>{`Step ${index+1} · ${labels[index+1]}`}</span> →</button>{index+1>unlockedThrough&&<small>{blockedMessage}</small>}</div>:<button type="button" className="forward-arrow" onClick={resetJourney}><span>Start another journey</span> ↻</button>}</div>}</div>)}
  </div>
}
