import { describe, it, expect } from "vitest";
import { averageBestQuizScores } from "../../src/learning/results";
import { getVideoEmbedUrl } from "../../src/learning/video";
describe("Certification results", () => {
  it("includes zero scores instead of inflating the average", () =>
    expect(
      averageBestQuizScores(
        ["a", "b"],
        [
          { quiz_id: "a", score: 10, max_score: 10 },
          { quiz_id: "b", score: 0, max_score: 10 },
        ],
      ),
    ).toBe(50));
  it("counts an unattempted quiz as zero", () =>
    expect(
      averageBestQuizScores(
        ["a", "b"],
        [{ quiz_id: "a", score: 10, max_score: 10 }],
      ),
    ).toBe(50));
  it("uses the best submitted score per quiz", () =>
    expect(
      averageBestQuizScores(
        ["a"],
        [
          { quiz_id: "a", score: 2, max_score: 10 },
          { quiz_id: "a", score: 8, max_score: 10 },
        ],
      ),
    ).toBe(80));
  it("handles empty and ungraded attempts", () =>
    expect(
      averageBestQuizScores(
        ["a"],
        [{ quiz_id: "a", score: null, max_score: 0 }],
      ),
    ).toBe(0));
});
describe("Video provider boundaries", () => {
  it("builds a Mux playback URL", () =>
    expect(getVideoEmbedUrl("mux", "playback123")).toBe(
      "https://player.mux.com/playback123",
    ));
  it("rejects arbitrary external URLs and injection", () => {
    expect(getVideoEmbedUrl("mux", "https://evil.test/video")).toBeNull();
    expect(getVideoEmbedUrl("cloudflare_stream", 'foo"bar')).toBeNull();
  });
  it("requires Bunny library and video identifiers", () => {
    expect(
      getVideoEmbedUrl("bunny", "123/12345678-1234-1234-1234-123456789012"),
    ).toContain("iframe.mediadelivery.net/embed/123/");
    expect(getVideoEmbedUrl("bunny", "123")).toBeNull();
  });
});
