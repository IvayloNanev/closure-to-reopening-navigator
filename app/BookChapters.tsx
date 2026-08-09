"use client";

import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";

const labels=["Start","Closure record","Choose violation","Plan timing","Review evidence","Manager summary"];

export function BookChapters({children,unlockedThrough=1}:{children:ReactNode;unlockedThrough?:number}){
  const pages=useMemo(()=>Children.toArray(children).filter(isValidElement) as ReactElement<{id?:string;className?:string}>[],[children]);
  const [active,setActive]=useState(0);
  const [furthest,setFurthest]=useState(1);
  const railRef=useRef<HTMLElement|null>(null);
  const go=useCallback((index:number)=>{const next=Math.max(0,Math.min(pages.length-1,index));const sequential=next===active+1&&next<=unlockedThrough;if(next>furthest&&!sequential)return;setActive(next);setFurthest(value=>Math.max(value,next));const id=pages[next]?.props.id;if(id)history.replaceState(null,"",`#${id}`);const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;requestAnimationFrame(()=>window.scrollTo({top:0,behavior:reduce?"auto":"smooth"}))},[pages,active,furthest,unlockedThrough]);

  useEffect(()=>{if(unlockedThrough<furthest)setFurthest(unlockedThrough)},[unlockedThrough,furthest]);
  useEffect(()=>{const selectEvent=(event:Event)=>{const index=pages.findIndex(page=>page.props.id===(event as CustomEvent<string>).detail);if(index>=0)go(index)};const reset=()=>{setActive(0);setFurthest(1);history.replaceState(null,"","#top");requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"auto"}))};window.addEventListener("six-days-go-step",selectEvent);window.addEventListener("six-days-reset",reset);return()=>{window.removeEventListener("six-days-go-step",selectEvent);window.removeEventListener("six-days-reset",reset)}},[pages,go]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent("six-days-journey-state",{detail:{active,furthest}}));railRef.current?.querySelector<HTMLElement>(`[data-step="${active}"]`)?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})},[active,furthest]);

  const blockedMessage=active===1?"Select a restaurant to continue":active===2?"Use the recommended records to continue":"Continue through this step to unlock the next";
  return <div className="guided-journey">
    <nav ref={railRef} className="journey-rail" aria-label="Journey progress"><strong className="rail-title">YOUR REOPENING JOURNEY</strong>{pages.map((page,index)=><div className="rail-stop" key={page.props.id??index}>{index>0&&<i className={index<=furthest?"filled":""} aria-hidden="true"/>}<button data-step={index} type="button" className={index===active?"current":index<active?"complete":""} disabled={index>furthest} onClick={()=>go(index)} aria-current={index===active?"step":undefined}><span>{index===0?"0":index}</span><small>{labels[index]}</small></button></div>)}</nav>
    <p className="mobile-step-status" aria-live="polite">{active===0?"Start":`Step ${active} of ${pages.length-1}`} · {labels[active]}</p>
    {pages.map((page,index)=><div className="journey-page" key={page.props.id??index} hidden={index!==active}>{cloneElement(page,{className:`${page.props.className??""} guided-card is-visible`})}{index>0&&<div className="page-arrows"><button type="button" className="back-arrow" onClick={()=>go(index-1)}>← <span>{index===1?"Start":`Step ${index-1}`}</span></button>{page.props.id==="compare"?<span/>:index<pages.length-1?<div className="forward-wrap"><button type="button" className="forward-arrow" disabled={index+1>unlockedThrough||index+1>furthest+1} onClick={()=>go(index+1)}><span>{`Step ${index+1} · ${labels[index+1]}`}</span> →</button>{index+1>unlockedThrough&&<small>{blockedMessage}</small>}</div>:<button type="button" className="forward-arrow" onClick={()=>window.dispatchEvent(new Event("six-days-reset"))}><span>Start another journey</span> ↻</button>}</div>}</div>)}
  </div>
}
