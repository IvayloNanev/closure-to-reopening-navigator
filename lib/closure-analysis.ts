export type RawInspectionRow = {
  camis:string; dba?:string; boro?:string; building?:string; street?:string; zipcode?:string;
  inspection_date:string; inspection_type?:string; action?:string; violation_code?:string;
  violation_description?:string; critical_flag?:string; score?:string; grade?:string;
  grade_date?:string; record_date?:string; latitude?:string; longitude?:string;
};

export type InspectionEvent = {
  id:string; camis:string; name:string; borough:string; address:string; zipcode:string;
  date:string; inspectionType:string; action:string; score:number|null; grade:string|null;
  gradeDate:string|null; recordDate:string|null; latitude:number|null; longitude:number|null;
  codes:Array<{code:string;description:string;critical:boolean}>;
};

export type ClosureEpisode = {
  id:string; camis:string; name:string; borough:string; address:string; zipcode:string;
  latitude:number|null; longitude:number|null; closure:InspectionEvent; reopening:InspectionEvent|null;
  laterClosure:InspectionEvent|null; reopeningDays:number|null; laterClosureDays:number|null;
};

export type CohortFilters={scope:"zip"|"borough"|"city";boroughOverride?:string;burdenTolerance:number;periodYears:number;inspectionType:boolean;minSharedCodes:number};

export const eventId=(row:Pick<RawInspectionRow,"camis"|"inspection_date"|"inspection_type"|"action">)=>[row.camis,row.inspection_date,row.inspection_type||"unknown",row.action||"unknown"].join("|");

export function groupInspectionRows(rows:RawInspectionRow[]):InspectionEvent[]{
  const grouped=new Map<string,InspectionEvent>();
  for(const row of rows){
    const id=eventId(row);
    if(!grouped.has(id))grouped.set(id,{id,camis:row.camis,name:row.dba||"Restaurant name unavailable",borough:row.boro&&row.boro!=="0"?row.boro:"Borough unavailable",address:[row.building,row.street].filter(Boolean).join(" ")||"Address unavailable",zipcode:row.zipcode||"ZIP unavailable",date:row.inspection_date.slice(0,10),inspectionType:row.inspection_type||"Inspection type unavailable",action:row.action||"Action unavailable",score:row.score?Number(row.score):null,grade:row.grade||null,gradeDate:row.grade_date?.slice(0,10)||null,recordDate:row.record_date?.slice(0,10)||null,latitude:row.latitude?Number(row.latitude):null,longitude:row.longitude?Number(row.longitude):null,codes:[]});
    if(row.violation_code&&!grouped.get(id)!.codes.some(code=>code.code===row.violation_code))grouped.get(id)!.codes.push({code:row.violation_code,description:row.violation_description||"Recorded violation",critical:row.critical_flag==="Critical"});
  }
  return [...grouped.values()].map(event=>({...event,codes:event.codes.sort((a,b)=>a.code.localeCompare(b.code))}));
}

const isClosed=(event:InspectionEvent)=>event.action.startsWith("Establishment Closed by DOHMH")||event.action.startsWith("Establishment re-closed by DOHMH");
const isReopened=(event:InspectionEvent)=>event.action.startsWith("Establishment re-opened by DOHMH");
const daysBetween=(a:string,b:string)=>Math.round((new Date(`${b}T00:00:00Z`).getTime()-new Date(`${a}T00:00:00Z`).getTime())/86400000);

export function buildClosureEpisodes(events:InspectionEvent[]):ClosureEpisode[]{
  const byRestaurant=new Map<string,InspectionEvent[]>();
  events.forEach(event=>byRestaurant.set(event.camis,[...(byRestaurant.get(event.camis)||[]),event]));
  const episodes:ClosureEpisode[]=[];
  for(const restaurantEvents of byRestaurant.values()){
    restaurantEvents.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
    let active:InspectionEvent|null=null;
    for(const event of restaurantEvents){
      // A re-closure is a new enforcement action. While an episode is active it
      // replaces the active start so the recorded interval begins at the most
      // recent closure/re-closure action before reopening.
      if(isClosed(event)){if(!active||event.action.startsWith("Establishment re-closed by DOHMH"))active=event;continue;}
      if(active&&isReopened(event)){
        episodes.push({id:`episode|${active.id}`,camis:active.camis,name:active.name,borough:active.borough,address:active.address,zipcode:active.zipcode,latitude:active.latitude,longitude:active.longitude,closure:active,reopening:event,laterClosure:null,reopeningDays:daysBetween(active.date,event.date),laterClosureDays:null});active=null;
      }
    }
    if(active)episodes.push({id:`episode|${active.id}`,camis:active.camis,name:active.name,borough:active.borough,address:active.address,zipcode:active.zipcode,latitude:active.latitude,longitude:active.longitude,closure:active,reopening:null,laterClosure:null,reopeningDays:null,laterClosureDays:null});
  }
  const episodesByRestaurant=new Map<string,ClosureEpisode[]>();
  episodes.forEach(episode=>episodesByRestaurant.set(episode.camis,[...(episodesByRestaurant.get(episode.camis)||[]),episode]));
  for(const list of episodesByRestaurant.values()){list.sort((a,b)=>a.closure.date.localeCompare(b.closure.date));for(let i=0;i<list.length-1;i++){if(list[i].reopening){list[i].laterClosure=list[i+1].closure;list[i].laterClosureDays=daysBetween(list[i].reopening!.date,list[i+1].closure.date)}}}
  return episodes.sort((a,b)=>b.closure.date.localeCompare(a.closure.date));
}

export function matchCohort(selected:ClosureEpisode,episodes:ClosureEpisode[],filters:CohortFilters){
  const selectedCodes=new Set(selected.closure.codes.map(code=>code.code));
  return episodes.filter(episode=>{
    if(episode.id===selected.id)return false;
    const geography=filters.scope==="city"||(filters.scope==="borough"?episode.borough===(filters.boroughOverride||selected.borough):episode.zipcode===selected.zipcode);
    const shared=episode.closure.codes.filter(code=>selectedCodes.has(code.code)).length;
    const burden=Math.abs(episode.closure.codes.length-selected.closure.codes.length)<=filters.burdenTolerance;
    const inspection=!filters.inspectionType||episode.closure.inspectionType===selected.closure.inspectionType;
    const period=Math.abs(new Date(episode.closure.date).getTime()-new Date(selected.closure.date).getTime())<=filters.periodYears*365.25*86400000;
    return geography&&shared>=filters.minSharedCodes&&burden&&inspection&&period;
  });
}

export function transitionAnalysis(episodes:ClosureEpisode[]){
  const eligible=episodes.filter(episode=>episode.reopening);const result=new Map<string,{absent:number;remained:number;appeared:number}>();
  eligible.forEach(episode=>{const closure=new Set(episode.closure.codes.map(c=>c.code));const reopening=new Set(episode.reopening!.codes.map(c=>c.code));new Set([...closure,...reopening]).forEach(code=>{const item=result.get(code)||{absent:0,remained:0,appeared:0};if(closure.has(code)&&reopening.has(code))item.remained++;else if(closure.has(code))item.absent++;else item.appeared++;result.set(code,item)})});
  return {eligible:eligible.length,codes:[...result.entries()].map(([code,value])=>({code,...value})).sort((a,b)=>(b.absent+b.remained+b.appeared)-(a.absent+a.remained+a.appeared))};
}

export function recurrenceAnalysis(episodes:ClosureEpisode[],referenceDate:string,horizonDays=365){
  const reopened=episodes.filter(e=>e.reopening);const eligible=reopened.filter(e=>daysBetween(e.reopening!.date,referenceDate)>=horizonDays);const reclosed=eligible.filter(e=>e.laterClosure&&e.laterClosureDays!==null&&e.laterClosureDays<=horizonDays);const counts=new Map<string,number>();reclosed.forEach(e=>{const later=new Set(e.laterClosure!.codes.map(c=>c.code));e.closure.codes.forEach(c=>{if(later.has(c.code))counts.set(c.code,(counts.get(c.code)||0)+1)})});
  return {retained:episodes.length,reopened:reopened.length,eligible:eligible.length,reclosed:reclosed.length,rate:eligible.length?reclosed.length/eligible.length*100:0,codes:[...counts.entries()].map(([code,count])=>({code,count,rate:reclosed.length?count/reclosed.length*100:0})).sort((a,b)=>b.count-a.count)};
}

export function timelineAnalysis(episodes:ClosureEpisode[],referenceDate:string){
  const matched=episodes.filter(e=>e.reopeningDays!==null);const values=matched.map(e=>e.reopeningDays!).sort((a,b)=>a-b);const median=values.length?(values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2):null;
  const thresholds=[7,14,30].map(days=>{const eligible=episodes.filter(e=>daysBetween(e.closure.date,referenceDate)>=days);const without=eligible.filter(e=>e.reopeningDays===null||e.reopeningDays>days);return {days,eligible:eligible.length,without:without.length,rate:eligible.length?without.length/eligible.length*100:0}});
  const unmatched=episodes.filter(e=>e.reopeningDays===null);const unmatchedObservable15=unmatched.filter(e=>daysBetween(e.closure.date,referenceDate)>=15).length;
  return {total:episodes.length,matched:matched.length,median,thresholds,values,unmatched:unmatched.length,unmatchedObservable15,unmatchedTooRecent15:unmatched.length-unmatchedObservable15};
}

export function snapshotChanges(previous:InspectionEvent[]|null,current:InspectionEvent[]){if(!previous)return null;const before=new Map(previous.map(e=>[e.id,JSON.stringify(e)]));return current.filter(e=>before.get(e.id)!==JSON.stringify(e));}
