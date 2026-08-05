import { useEffect, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { operationsApi, type UserProfile } from "@/api/operations";
import { Badge, Busy, Empty, Panel, PageIntro, Problem, tableHeadClass } from "@/pages/Operations/operation-ui";

export function UsersPage() {
  const [me, setMe] = useState<UserProfile | null>(null); const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true); const [denied, setDenied] = useState(false); const [error, setError] = useState("");
  useEffect(() => { void (async () => { try { setMe(await operationsApi.me()); try { setUsers(await operationsApi.users()); } catch (err: any) { if (err?.response?.status === 403) setDenied(true); else setError("The user roster is unavailable."); } } catch { setError("Your profile could not be loaded."); } finally { setLoading(false); } })(); }, []);
  const State = ({ user }: { user: UserProfile }) => <Badge status={user.is_active === false ? "INACTIVE" : "ACTIVE"} />;
  return <main className="space-y-5"><PageIntro eyebrow="Administration" title="Users & access" />
    {loading ? <Busy /> : error ? <Problem message={error} /> : <>
      <Panel className="p-5"><div className="flex items-center gap-4"><div className="grid h-11 w-11 place-items-center rounded-full bg-brand-forest text-white"><UserRound className="h-5 w-5" /></div><div><p className="m-0 text-xs uppercase tracking-wider text-brand-muted">Signed in profile</p><p className="mb-0 mt-1 font-semibold text-brand-forest">{me?.full_name}</p><p className="mb-0 mt-0.5 text-sm text-brand-muted">{me?.email} · <span className="font-semibold">{me?.role}</span></p></div></div></Panel>
      <Panel><div className="flex items-center gap-2 border-b border-brand-border p-4"><ShieldCheck className="h-4 w-4 text-brand-gold-dark" /><p className="m-0 text-sm font-semibold text-brand-forest">Workspace roster</p></div>
        {denied ? <Empty title="Roster access is restricted" detail="Your profile is available above. Only administrators can view the full user roster." /> : !users.length ? <Empty title="No workspace users" detail="There are currently no users your account can view." /> : <>
          <div className="divide-y divide-brand-border sm:hidden">{users.map(user => <article className="p-4" key={user.id}><p className="m-0 font-semibold text-brand-forest">{user.full_name}</p><p className="mb-3 mt-1 break-all text-xs text-brand-muted">{user.email}</p><div className="flex flex-wrap gap-2"><span className="rounded-full border border-brand-border px-2.5 py-1 text-xs font-medium text-brand-forest">{user.role}</span><State user={user} /></div></article>)}</div>
          <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-150 text-left text-sm"><thead className={tableHeadClass}><tr><th className="px-5 py-3">User</th><th>Role</th><th>Account status</th></tr></thead><tbody>{users.map(user => <tr className="border-t border-brand-border hover:bg-brand-background/30" key={user.id}><td className="px-5 py-4"><p className="m-0 font-semibold text-brand-forest">{user.full_name}</p><p className="mb-0 mt-1 text-xs text-brand-muted">{user.email}</p></td><td className="font-medium">{user.role}</td><td><State user={user} /></td></tr>)}</tbody></table></div>
        </>}</Panel></>}
  </main>;
}
