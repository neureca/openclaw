import type { Bot } from "grammy";
import { describe, expect, it, vi } from "vitest";
import type { RuntimeEnv } from "../../runtime.js";
import { sendTelegramText } from "./delivery.send.js";

function createRuntime(): Pick<RuntimeEnv, "log" | "error" | "exit"> {
  return {
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
  };
}

function createBot(sendMessage: ReturnType<typeof vi.fn>): Bot {
  return { api: { sendMessage } } as unknown as Bot;
}

describe("sendTelegramText", () => {
  it("retries once on recoverable telegram network errors", async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network request for 'sendMessage' failed!"))
      .mockResolvedValueOnce({ message_id: 42, chat: { id: "123" } });
    const runtime = createRuntime();

    const messageId = await sendTelegramText(createBot(sendMessage), "123", "hello", runtime, {
      textMode: "html",
      plainText: "hello",
    });

    expect(messageId).toBe(42);
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(runtime.log).toHaveBeenCalledWith(
      expect.stringContaining("recoverable network error; retrying once"),
    );
  });
});
