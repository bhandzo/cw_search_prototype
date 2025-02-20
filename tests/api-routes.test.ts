import { POST as clockworkSearch } from "@/app/api/clockwork-search/route";
import { POST as openAiSearch } from "@/app/api/openai-search/route";

// Mock Request and Response
global.Request = class MockRequest {
  private url: string;
  private options: RequestInit;

  constructor(url: string, options: RequestInit = {}) {
    this.url = url;
    this.options = options;
  }

  async json() {
    return JSON.parse(this.options.body as string);
  }
} as unknown as typeof Request;

describe("API Routes", () => {
  describe("/api/clockwork-search", () => {
    it("returns mock candidate data", async () => {
      const request = new Request("http://localhost:3000/api/clockwork-search", {
        method: "POST",
        body: JSON.stringify({
          query: "Senior Developer",
          apiKey: "test-key",
          firmApiKey: "test-firm-key",
          firmSlug: "test-firm"
        })
      });

      const response = await clockworkSearch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.candidates).toBeDefined();
      expect(data.candidates.length).toBeGreaterThan(0);
      expect(data.candidates[0]).toHaveProperty("name");
    });
  });

  describe("/api/openai-search", () => {
    it("returns structured query from user input", async () => {
      const request = new Request("http://localhost:3000/api/openai-search", {
        method: "POST",
        body: JSON.stringify({
          userInput: "Find me senior developers with React experience",
          clockworkContext: {}
        })
      });

      const response = await openAiSearch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.structuredQuery).toBeDefined();
      expect(data.originalInput).toBeDefined();
    });
  });
});
