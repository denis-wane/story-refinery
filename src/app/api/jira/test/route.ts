import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  const db = getDb();

  const getConfig = (key: string) => {
    const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key) as
      | { value: string }
      | undefined;
    return row?.value ?? "";
  };

  const url = getConfig("jira_url");
  const email = getConfig("jira_email");
  const apiKey = getConfig("jira_api_key");

  if (!url || !email || !apiKey) {
    return NextResponse.json(
      { ok: false, error: "Jira URL, email, and API key are required" },
      { status: 400 }
    );
  }

  try {
    const auth = Buffer.from(`${email}:${apiKey}`).toString("base64");
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const user = await res.json();
      return NextResponse.json({
        ok: true,
        user: user.displayName || user.emailAddress,
      });
    } else {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` },
        { status: 400 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
