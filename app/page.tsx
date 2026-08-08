import type { Metadata } from "next";
import { getClosureAnalysis } from "../lib/inspections";
import { OwnerWizard } from "./OwnerWizard";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Six Days — Restaurant Closure Navigator",description:"A guided NYC restaurant closure-to-reopening data journey."};

export default async function Home(){
  const analysis=await getClosureAnalysis();
  if(!analysis.ok)return <main className="wizard-error"><h1>Six Days</h1><p>The NYC Open Data connection is temporarily unavailable. Please try again shortly.</p></main>;
  return <OwnerWizard restaurants={analysis.restaurantRecords} benchmarks={analysis.benchmarkRecords} repeats={analysis.repeatClosurePatterns}/>;
}
