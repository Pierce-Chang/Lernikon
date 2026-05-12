import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  getActiveChildProfile,
  getCurrentUserRow,
  listChildProfiles,
  listRecentWorksheets,
} from "@/lib/db/queries";
import { getQuota } from "@/lib/worksheet/rate-limit";
import { formatGradeShort } from "@/lib/format/grade";
import {
  SUBJECT_LABELS,
  TOPIC_REGISTRY,
  topicsForGrade,
  listAllImplementedTopics,
  isTopicId,
} from "@/lib/worksheet/topics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChildSelector } from "./child-selector";

export const metadata = { title: "Übersicht" };

const formatRelative = (iso: string) => {
  const date = new Date(iso),
    today = new Date(),
    sameDay =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  if (sameDay) {
    return new Intl.DateTimeFormat("de-DE", { timeStyle: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
};

const summarizeWorksheet = (subject: string, config: Record<string, unknown>): string => {
  const topic = typeof config.topic === "string" ? config.topic : null;
  if (topic === "mathe-rechnen") {
    const op = String(config.operation ?? "?"),
      rmin = config.rangeMin,
      rmax = config.rangeMax,
      count = config.count;
    return `Rechnen · ${op} · bis ${rmax} · ${count} Aufgaben`;
  }
  if (topic === "deutsch-buchstaben-schreiben") {
    return `Buchstaben schreiben`;
  }
  return subject;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [children, userRow, recent] = await Promise.all([
    listChildProfiles(),
    getCurrentUserRow(),
    listRecentWorksheets(user.id, 5),
  ]);
  if (children.length === 0) redirect("/onboarding");

  const active = await getActiveChildProfile(user.id);
  if (!active) redirect("/onboarding");

  const quota = await getQuota(user.id, userRow),
    isAdmin = userRow?.is_admin ?? false,
    topics = isAdmin ? listAllImplementedTopics() : topicsForGrade(active.grade),
    quotaLine = quota.isPaid
      ? "Family Pro · unbegrenzt"
      : Number.isFinite(quota.remaining)
        ? `Heute noch ${quota.remaining} von ${quota.limit} Arbeitsblättern`
        : null,
    recentForActive = recent.filter(
      (row) => row.child_id === null || row.child_id === active.id,
    );

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Übersicht</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Für <span className="font-medium">{active.name}</span> ·{" "}
          {formatGradeShort(active.grade)}
          {quotaLine && <> · {quotaLine}</>}
        </p>
        {children.length > 1 && (
          <div className="mt-4">
            <ChildSelector
              items={children.map((c) => ({ id: c.id, name: c.name }))}
              activeId={active.id}
            />
          </div>
        )}
      </header>

      <section>
        <h2 className="text-xl font-semibold">Was möchtest du heute üben?</h2>
        {topics.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Für {formatGradeShort(active.grade)} gibt es aktuell noch keine Themen. Wir
            bauen das gerade aus.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {topics.map((topic) => (
              <Card key={topic.id} className="flex flex-col">
                <CardHeader>
                  <CardDescription className="text-xs uppercase tracking-wide">
                    {SUBJECT_LABELS[topic.subject]}
                  </CardDescription>
                  <CardTitle className="text-lg">{topic.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-muted-foreground text-sm">{topic.description}</p>
                  <Button render={<Link href={topic.href} />}>Erstellen</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {recentForActive.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Zuletzt erstellt</h2>
          <ul className="mt-4 divide-y divide-border rounded-md border">
            {recentForActive.map((row) => {
              const topicId =
                  typeof row.config_json.topic === "string" &&
                  isTopicId(row.config_json.topic)
                    ? row.config_json.topic
                    : null,
                topicMeta = topicId ? TOPIC_REGISTRY[topicId] : null,
                summary = summarizeWorksheet(row.subject, row.config_json);
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{summary}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatRelative(row.generated_at)}
                    </span>
                  </div>
                  {topicMeta && (
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={topicMeta.href} />}
                    >
                      Erneut erstellen
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
