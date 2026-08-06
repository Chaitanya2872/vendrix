import type { ReactNode } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
export const statusTone=(s:string)=> /RECEIVED|DELIVERED/.test(s)?"bg-emerald-50 text-emerald-800":/CANCEL|FAILED/.test(s)?"bg-red-50 text-red-700":/ORDERED|TRANSIT/.test(s)?"bg-amber-50 text-amber-800":"bg-slate-100 text-slate-700";
export function Status({value}:{value:string}){return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(value)}`}>{value.replaceAll("_"," ")}</span>}
export const Input=({children}:{children:ReactNode})=><div className="grid gap-1.5 text-sm font-semibold text-brand-text">{children}</div>;
export const inputClass="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15";
export function Loading(){return <div className="grid min-h-64 place-items-center text-sm text-brand-muted"><span className="flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin"/>Loading ledger records</span></div>}
export function ErrorState({message}:{message:string}){return <div className="grid min-h-64 place-items-center p-6 text-center"><div><AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-700"/><p className="m-0 font-semibold text-red-800">{message}</p><p className="mt-1 text-sm text-brand-muted">Refresh the page or check your API connection.</p></div></div>}
export const currency=(amount:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(amount||0);
export const displayDate=(value?:string)=>value?new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value)):"—";
