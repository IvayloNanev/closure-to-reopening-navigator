import { buildClosureEpisodes, groupInspectionRows, type RawInspectionRow } from "./closure-analysis";

const ENDPOINT="https://data.cityofnewyork.us/resource/43nn-pn8j.json";

async function loadNavigatorData(){
  const now=new Date();const start=`${now.getUTCFullYear()-4}-01-01`;const limit=50000;const rows:RawInspectionRow[]=[];
  for(let offset=0;;offset+=limit){
    const params=new URLSearchParams({"$select":"camis,dba,boro,building,street,zipcode,inspection_date,inspection_type,action,violation_code,violation_description,critical_flag,score,grade,grade_date,record_date,latitude,longitude","$where":`inspection_date >= '${start}T00:00:00.000' AND (action like 'Establishment Closed by DOHMH%' OR action like 'Establishment re-closed by DOHMH%' OR action like 'Establishment re-opened by DOHMH%')`,"$order":"camis,inspection_date,action","$limit":String(limit),"$offset":String(offset)});
    const response=await fetch(`${ENDPOINT}?${params}`,{headers:{Accept:"application/json"},next:{revalidate:21600}});if(!response.ok)throw new Error(`NYC Open Data returned ${response.status}`);
    const page=await response.json() as RawInspectionRow[];rows.push(...page);if(page.length<limit)break;
  }
  const events=groupInspectionRows(rows);const episodes=buildClosureEpisodes(events);
  return {episodes,events,fetchedAt:now.toISOString(),recordCount:rows.length,dateRange:`${start}–${now.toISOString().slice(0,10)}`};
}

type NavigatorData=Awaited<ReturnType<typeof loadNavigatorData>>;
let cachedNavigator:{data:NavigatorData;expires:number}|null=null;
let pendingNavigator:Promise<NavigatorData>|null=null;

export async function getNavigatorData(){
  if(cachedNavigator&&cachedNavigator.expires>Date.now())return cachedNavigator.data;
  if(!pendingNavigator)pendingNavigator=loadNavigatorData().then(data=>{cachedNavigator={data,expires:Date.now()+21600000};return data}).finally(()=>{pendingNavigator=null});
  return pendingNavigator;
}
