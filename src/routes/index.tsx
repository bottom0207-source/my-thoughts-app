import { createFileRoute } from "@tanstack/react-router";
import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Feedback = {
  id: string;
  name: string;
  content: string;
  created_at: string;
};

const feedbacksQueryOptions = queryOptions({
  queryKey: ["feedbacks"],
  queryFn: async (): Promise<Feedback[]> => {
    const { data, error } = await supabase
      .from("feedbacks")
      .select("id, name, content, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
});

// Deterministic formatting so server-rendered output matches hydration.
function formatKST(iso: string) {
  return new Date(iso).toLocaleString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "의견 수집" },
      { name: "description", content: "이름과 의견을 남기고 저장하는 간단한 수집 앱" },
      { property: "og:title", content: "의견 수집" },
      { property: "og:description", content: "이름과 의견을 남기고 저장하는 간단한 수집 앱" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(feedbacksQueryOptions),
  component: Index,
});

function Index() {
  const { data: feedbacks } = useSuspenseQuery(feedbacksQueryOptions);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || !trimmedContent) {
      setError("이름과 의견을 모두 입력해 주세요.");
      return;
    }
    if (trimmedName.length > 50) {
      setError("이름은 50자 이내로 입력해 주세요.");
      return;
    }
    if (trimmedContent.length > 500) {
      setError("의견은 500자 이내로 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("feedbacks")
      .insert({ name: trimmedName, content: trimmedContent });

    if (insertError) {
      setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
      return;
    }

    setName("");
    setContent("");
    await queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
        <header>
          <p className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            Feedback
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            의견을 남겨주세요
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            남겨주신 의견은 데이터베이스에 저장되어 새로고침 후에도 그대로 유지됩니다.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <label
            htmlFor="feedback-name"
            className="text-sm font-semibold text-foreground"
          >
            이름
          </label>
          <input
            id="feedback-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            maxLength={50}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />

          <label
            htmlFor="feedback-content"
            className="mt-5 block text-sm font-semibold text-foreground"
          >
            의견
          </label>
          <textarea
            id="feedback-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="하고 싶은 말을 자유롭게 적어주세요"
            maxLength={500}
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {error ?? `${content.length}/500자`}
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "저장 중…" : "의견 남기기"}
            </button>
          </div>
        </form>

        <section className="mt-10">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            지금까지 {feedbacks.length}개의 의견이 모였어요
          </h2>

          {feedbacks.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
              아직 남겨진 의견이 없어요. 첫 번째 의견을 남겨보세요!
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {feedbacks.map((f) => (
                <li
                  key={f.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {f.name}
                    </span>
                    <time className="text-xs text-muted-foreground">
                      {formatKST(f.created_at)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {f.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
