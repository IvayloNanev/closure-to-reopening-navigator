import { buildClosureEpisodes, groupInspectionRows, type RawInspectionRow } from "./closure-analysis";

const ENDPOINT="https://data.cityofnewyork.us/resource/43nn-pn8j.json";

export async function getNavigatorData(){
  const now=new Date();const start=`${now.getUTCFullYear()-4}-01-01`;const limit=50000;const rows:RawInspectionRow[]=[];
  for(let offset=0;;offset+=limit){
    const params=new URLSearchParams({"$select":"camis,dba,boro,building,street,zipcode,inspection_date,inspection_type,action,violation_code,violation_description,critical_flag,score,grade,grade_date,record_date,latitude,longitude","$where":`inspection_date >= '${start}T00:00:00.000' AND (action like 'Establishment Closed by DOHMH%' OR action like 'Establishment re-opened by DOHMH%')`,"$order":"camis,inspection_date","$limit":String(limit),"$offset":String(offset)});
    const response=await fetch(`${ENDPOINT}?${params}`,{headers:{Accept:"application/json"},next:{revalidate:21600}});if(!response.ok)throw new Error(`NYC Open Data returned ${response.status}`);
    const page=await response.json() as RawInspectionRow[];rows.push(...page);if(page.length<limit)break;
  }
  const events=groupInspectionRows(rows);const episodes=buildClosureEpisodes(events);
  return {episodes,events,fetchedAt:now.toISOString(),recordCount:rows.length,dateRange:`${start}–${now.toISOString().slice(0,10)}`};
}
