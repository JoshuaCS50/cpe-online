import { describe, expect, it, vi } from "vitest";
import { createStdinQueue } from "../../src/terminal/stdin-queue";

describe("push and drain", () => {
  it("returns the split parts and drain returns them joined with trailing newlines", () => {
    const queue = createStdinQueue();
    expect(queue.push("a\nb")).toEqual(["a", "b"]);
    expect(queue.drain()).toBe("a\nb\n");
  });

  it("splits on both \\n and \\r\\n", () => {
    const queue = createStdinQueue();
    expect(queue.push("a\r\nb\nc")).toEqual(["a", "b", "c"]);
    expect(queue.drain()).toBe("a\nb\nc\n");
  });

  it("buffers a newline for an empty push", () => {
    const queue = createStdinQueue();
    expect(queue.push("")).toEqual([""]);
    expect(queue.drain()).toBe("\n");
  });
});

describe("readLine", () => {
  it("resolves immediately when a line is already buffered, in push order", async () => {
    const queue = createStdinQueue();
    queue.push("first\nsecond\n");
    await expect(queue.readLine()).resolves.toBe("first");
    await expect(queue.readLine()).resolves.toBe("second");
  });

  it("waits before any input, then resolves with the first line after push", async () => {
    const queue = createStdinQueue();
    const pending = queue.readLine();
    expect(queue.pendingReads).toBe(1);
    queue.push("hello");
    await expect(pending).resolves.toBe("hello");
    expect(queue.pendingReads).toBe(0);
  });

  it("resolves two waiting reads in request order from one push", async () => {
    const queue = createStdinQueue();
    const first = queue.readLine();
    const second = queue.readLine();
    expect(queue.pendingReads).toBe(2);
    expect(queue.push("a\nb")).toEqual(["a", "b"]);
    await expect(Promise.all([first, second])).resolves.toEqual(["a", "b"]);
    expect(queue.pendingReads).toBe(0);
  });
});

describe("tryReadLineSync", () => {
  it("returns null on an empty queue and the line otherwise, consuming it", () => {
    const queue = createStdinQueue();
    expect(queue.tryReadLineSync()).toBeNull();
    queue.push("only");
    expect(queue.tryReadLineSync()).toBe("only");
    expect(queue.tryReadLineSync()).toBeNull();
    expect(queue.lineCount()).toBe(0);
  });
});

describe("drain and lineCount", () => {
  it("drain empties the buffer and lineCount becomes 0", () => {
    const queue = createStdinQueue();
    queue.push("a\nb");
    expect(queue.drain()).toBe("a\nb\n");
    expect(queue.lineCount()).toBe(0);
    expect(queue.drain()).toBe("");
  });

  it("lineCount ignores empty lines", () => {
    const queue = createStdinQueue();
    queue.push("a\n\nb");
    expect(queue.lineCount()).toBe(2);
  });
});

describe("cancellation", () => {
  it("rejects a waiting read with a cancelled error and clears pendingReads", async () => {
    const queue = createStdinQueue();
    const pending = queue.readLine();
    expect(queue.pendingReads).toBe(1);
    queue.cancelPendingReads();
    await expect(pending).rejects.toThrow("cancelled");
    expect(queue.pendingReads).toBe(0);
  });

  it("rejects with the provided reason", async () => {
    const queue = createStdinQueue();
    const pending = queue.readLine();
    const stopped = new Error("stopped");
    queue.cancelPendingReads(stopped);
    await expect(pending).rejects.toBe(stopped);
  });

  it("reset empties the buffer and rejects waiting reads", async () => {
    const queue = createStdinQueue();
    queue.push("a\nb");
    queue.reset();
    expect(queue.lineCount()).toBe(0);
    expect(queue.drain()).toBe("");

    const pending = queue.readLine();
    queue.reset();
    await expect(pending).rejects.toThrow("cancelled");
    expect(queue.pendingReads).toBe(0);
  });

  it("a cancelled read does not consume input pushed later", async () => {
    const queue = createStdinQueue();
    const pending = queue.readLine();
    queue.cancelPendingReads();
    await expect(pending).rejects.toThrow("cancelled");
    queue.push("x");
    expect(queue.lineCount()).toBe(1);
    await expect(queue.readLine()).resolves.toBe("x");
  });
});

describe("onChange", () => {
  it("fires for push, consuming readLine, tryReadLineSync, drain and reset", async () => {
    const onChange = vi.fn();
    const queue = createStdinQueue(onChange);

    queue.push("a");
    expect(onChange).toHaveBeenCalledTimes(1);

    await queue.readLine();
    expect(onChange).toHaveBeenCalledTimes(2);

    queue.push("b");
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(queue.tryReadLineSync()).toBe("b");
    expect(onChange).toHaveBeenCalledTimes(4);

    queue.push("c");
    expect(onChange).toHaveBeenCalledTimes(5);
    queue.drain();
    expect(onChange).toHaveBeenCalledTimes(6);

    queue.reset();
    expect(onChange).toHaveBeenCalledTimes(7);
  });
});
