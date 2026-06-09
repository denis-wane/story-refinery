import { NextRequest } from "next/server";
import { subscribe } from "@/lib/pipeline/engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial keepalive
      send({ type: "connected", run_id: runId });

      const unsubscribe = subscribe(runId, (event) => {
        send({ ...event, run_id: runId, timestamp: new Date().toISOString() });

        // Close stream when run completes
        if (event.type === "run_completed" || event.type === "step_failed") {
          setTimeout(() => {
            try {
              controller.close();
            } catch {
              // Stream may already be closed
            }
          }, 1000);
        }
      });

      // Clean up on abort
      _request.signal.addEventListener("abort", () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
