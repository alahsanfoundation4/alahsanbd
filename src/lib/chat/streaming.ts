import { serviceError } from "@/lib/service-errors";

export function friendlyError(status: number, text: string): string {
  if ([402, 429, 503].includes(status)) return serviceError(status, text);
  const t = text.toLowerCase();
  if (status === 401 || status === 403 || /api key|unauthorized|permission/.test(t)) {
    return "এআই এপিআই কী মেয়াদোত্তীর্ণ বা অনুমতি নেই। অ্যাডমিন প্যানেলে সঠিক কী নিশ্চিত করুন।";
  }
  if (status === 404 || /model.*not found|deprecated/.test(t)) {
    return "নির্বাচিত মডেলটি বর্তমানে প্রোভাইডারের কাছে সচল নেই। অন্য মডেল নির্বাচন করুন।";
  }
  if (status === 504 || /timeout/.test(t)) {
    return "এআই প্রোভাইডার সময়মতো সাড়া দেয়নি (Timeout)। আবার অনুরোধ পাঠান।";
  }
  if (status >= 500) {
    return "এআই প্রোভাইডারের সার্ভারে সাময়িক সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।";
  }
  return `উত্তর তৈরি করা যায়নি (কোড: ${status})। অনুগ্রহ করে আবার চেষ্টা করুন।`;
}

export function withStages(
  stages: string[],
  upstream: ReadableStream<Uint8Array>,
  upstreamController?: AbortController,
  actualProvider?: string,
  actualModel?: string
): Response {
  const enc = new TextEncoder();
  const sse = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);
  const reader = upstream.getReader();
  let isClosed = false;

  const push = (controller: ReadableStreamDefaultController<Uint8Array>, val: Uint8Array) => {
    if (isClosed) return;
    try { controller.enqueue(val); } catch { isClosed = true; }
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const s of stages) {
        push(controller, sse({ type: "stage", stage: s }));
      }
      if (actualProvider || actualModel) {
        push(controller, sse({ type: "meta", provider: actualProvider, model: actualModel }));
      }
      try {
        while (!isClosed) {
          const { done, value } = await reader.read();
          if (done) break;
          push(controller, value);
        }
      } catch (err: any) {
        if (!isClosed) {
          push(controller, sse({ error: friendlyError(500, err?.message || "") }));
        }
      } finally {
        isClosed = true;
        try { controller.close(); } catch {}
      }
    },
    cancel() {
      isClosed = true;
      upstreamController?.abort();
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export function stageStream(stages: string[], work: () => Promise<string>): Response {
  const enc = new TextEncoder();
  const sse = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const s of stages) {
        controller.enqueue(sse({ type: "stage", stage: s }));
      }
      try {
        const text = await work();
        controller.enqueue(sse({ choices: [{ delta: { content: text } }] }));
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
      } catch (err: any) {
        controller.enqueue(sse({ error: friendlyError(500, err?.message || "") }));
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
