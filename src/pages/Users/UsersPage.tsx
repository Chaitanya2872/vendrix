import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { operationsApi, type UserProfile } from "@/api/operations";
import { FilterBar } from "@/components/common/FilterBar";
import { facetFrom, useFilters } from "@/hooks/useFilters";
import { Badge, Busy, Empty, Panel, PageIntro, Problem, SearchField, tableHeadClass } from "@/pages/Operations/operation-ui";

/** Account state as a single filterable value. `is_active` is a tri-state on
 * the wire — true, false, or absent on older records — and absent has always
 * been treated as active by the badge, so the filter matches that reading
 * rather than inventing a third option nobody can act on. */
const accountState = (user: UserProfile) => (user.is_active === false ? "INACTIVE" : "ACTIVE");

/** Axios rejects with an error carrying `response.status`. Narrowed here
 * rather than cast to `any`, so a change in the client's error shape is a
 * compile error instead of a permission check that silently stops working. */
function isForbidden(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403;
}

export function UsersPage() {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setMe(await operationsApi.me());
        try {
          setUsers(await operationsApi.users());
        } catch (rosterError) {
          // A non-admin gets 403 here and that is not a failure — their own
          // profile above is all they are entitled to see.
          if (isForbidden(rosterError)) setDenied(true);
          else setError("The user roster is unavailable.");
        }
      } catch {
        setError("Your profile could not be loaded.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filters = useFilters({
    facets: [
      { key: "role", label: "Role", options: facetFrom(users, user => user.role, role => role.replaceAll("_", " ")) },
      {
        key: "state",
        label: "Account status",
        options: facetFrom(users, accountState, value => (value === "ACTIVE" ? "Active" : "Inactive")),
      },
    ],
    // Only offered when the roster actually carries join dates; an older API
    // omits created_at, and a date filter that silently excludes everything
    // is worse than no date filter.
    dates: users.some(user => user.created_at) ? [{ key: "joined", label: "Joined" }] : [],
  });

  const { matches } = filters;
  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return users.filter(user => {
      if (!matches({ role: user.role, state: accountState(user), joined: user.created_at })) return false;
      if (!search) return true;
      return `${user.full_name} ${user.email} ${user.role}`.toLowerCase().includes(search);
    });
  }, [users, query, matches]);

  const State = ({ user }: { user: UserProfile }) => <Badge status={accountState(user)} />;

  return (
    <main className="space-y-5">
      <PageIntro eyebrow="Administration" title="Users & access" />

      {loading ? <Busy /> : error ? <Problem message={error} /> : <>
        <Panel className="p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-forest text-white">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">Signed in profile</p>
              <p className="mb-0 mt-1 font-semibold text-brand-forest">{me?.full_name}</p>
              <p className="mb-0 mt-0.5 text-sm text-brand-muted">{me?.email} · <span className="font-semibold">{me?.role}</span></p>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col gap-3 border-b border-brand-border p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <p className="m-0 flex items-center gap-2 self-center text-sm font-semibold text-brand-forest">
                <ShieldCheck className="h-4 w-4 text-brand-gold-dark" />
                Workspace roster
              </p>
              {/* The controls are pointless without a roster to narrow, and
                  showing them to someone who cannot see one reads as a
                  broken screen rather than a restricted one. */}
              {!denied && users.length > 0 && (
                <div className="sm:min-w-75">
                  <SearchField value={query} onChange={setQuery} placeholder="Search name, email or role" />
                </div>
              )}
            </div>
            {!denied && users.length > 0 && <FilterBar filters={filters} />}
          </div>

          {denied ? (
            <Empty title="Roster access is restricted" detail="Your profile is available above. Only administrators can view the full user roster." />
          ) : !users.length ? (
            <Empty title="No workspace users" detail="There are currently no users your account can view." />
          ) : !rows.length ? (
            <Empty title="No users match these filters" detail="Clear a filter or change the search to see more of the roster." />
          ) : <>
            <div className="divide-y divide-brand-border sm:hidden">
              {rows.map(user => (
                <article className="p-4" key={user.id}>
                  <p className="m-0 font-semibold text-brand-forest">{user.full_name}</p>
                  <p className="mb-3 mt-1 break-all text-xs text-brand-muted">{user.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-brand-border px-2.5 py-1 text-xs font-medium text-brand-forest">{user.role}</span>
                    <State user={user} />
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-150 text-left text-sm">
                <thead className={tableHeadClass}>
                  <tr><th className="px-5 py-3">User</th><th>Role</th><th>Account status</th></tr>
                </thead>
                <tbody>
                  {rows.map(user => (
                    <tr className="border-t border-brand-border hover:bg-brand-background/30" key={user.id}>
                      <td className="px-5 py-4">
                        <p className="m-0 font-semibold text-brand-forest">{user.full_name}</p>
                        <p className="mb-0 mt-1 text-xs text-brand-muted">{user.email}</p>
                      </td>
                      <td className="font-medium">{user.role}</td>
                      <td><State user={user} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="border-t border-brand-border px-5 py-3 text-xs text-brand-muted">
              Showing {rows.length} of {users.length} users
            </footer>
          </>}
        </Panel>
      </>}
    </main>
  );
}
