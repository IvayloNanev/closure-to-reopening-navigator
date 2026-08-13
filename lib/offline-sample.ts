import type { ClosureEpisode, InspectionEvent } from "./closure-analysis";

const codes=[
  {code:"04M",description:"Live roaches in facility's food or non-food area.",critical:true},
  {code:"08A",description:"Establishment is not free of harborage or conditions conducive to pests.",critical:false},
];

function event(camis:string,name:string,borough:string,date:string,action:string,score:number,latitude:number,longitude:number):InspectionEvent{
  return {id:`offline|${camis}|${date}|${action}`,camis,name,borough,address:"Saved demonstration address",zipcode:"10001",date,inspectionType:"Cycle Inspection / Initial Inspection",action,score,grade:null,gradeDate:null,recordDate:"2026-08-01",latitude,longitude,codes};
}

function episode(camis:string,name:string,borough:string,closureDate:string,reopeningDate:string,days:number,latitude:number,longitude:number):ClosureEpisode{
  const closure=event(camis,name,borough,closureDate,"Establishment Closed by DOHMH. Violations were cited.",28,latitude,longitude);
  const reopening=event(camis,name,borough,reopeningDate,"Establishment re-opened by DOHMH.",12,latitude,longitude);
  return {id:`offline-episode|${camis}`,camis,name,borough,address:closure.address,zipcode:closure.zipcode,latitude,longitude,closure,reopening,laterClosure:null,reopeningDays:days,laterClosureDays:null};
}

export const offlineSampleEpisodes:ClosureEpisode[]=[
  episode("90000001","SIX DAYS SAMPLE KITCHEN","Manhattan","2026-06-01","2026-06-07",6,40.7505,-73.9934),
  episode("90000002","SAMPLE CAFE NORTH","Manhattan","2026-05-04","2026-05-06",2,40.7681,-73.9819),
  episode("90000003","SAMPLE TABLE EAST","Queens","2026-04-10","2026-04-14",4,40.7447,-73.9485),
  episode("90000004","SAMPLE GRILL SOUTH","Brooklyn","2026-03-02","2026-03-07",5,40.6782,-73.9442),
  episode("90000005","SAMPLE DELI WEST","Bronx","2026-02-12","2026-02-19",7,40.8448,-73.8648),
];

export const offlineSampleEvents=offlineSampleEpisodes.flatMap(item=>[item.closure,item.reopening!]);
export const offlineSampleFetchedAt="2026-08-01T12:00:00.000Z";
