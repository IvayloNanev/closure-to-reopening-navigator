import type { Metadata } from "next";
import { getBoroughMap } from "../lib/inspections";
import { getNavigatorData } from "../lib/navigator-data";
import { OwnerWizard } from "./OwnerWizard";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Six Days — Restaurant Closure Navigator",description:"A guided NYC restaurant closure-to-reopening data journey."};

export default async function Home(){
  const loaded=await loadData();
  if(!loaded)return <main className="wizard-error"><h1>Six Days</h1><p>The NYC Open Data connection is temporarily unavailable. Please try again shortly.</p></main>;
  return <OwnerWizard episodes={loaded.data.episodes} events={loaded.data.events} boroughMap={loaded.boroughMap} fetchedAt={loaded.data.fetchedAt}/>;
}

async function loadData(){try{const [data,boroughMap]=await Promise.all([getNavigatorData(),getBoroughMap()]);return {data,boroughMap}}catch{return null}}
