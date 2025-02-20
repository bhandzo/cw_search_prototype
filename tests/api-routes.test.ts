import { POST as clockworkSearch } from "@/app/api/clockwork-search/route";
import { POST as openAiSearch } from "@/app/api/openai-search/route";

// Mock Request
const mockRequest = (body: any) => {
  return {
    json: async () => body
  } as Request;
};

describe("API Routes", () => {
  describe("/api/clockwork-search", () => {
    it("returns mock candidate data", async () => {
      const request = mockRequest({
        query: "Senior Developer",
        apiKey: "test-key",
        firmApiKey: "test-firm-key",
        firmSlug: "test-firm"
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
      const request = mockRequest({
        userInput: "Find me senior developers with React experience",
        clockworkContext: {}
      });

      const response = await openAiSearch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.structuredQuery).toBeDefined();
      expect(data.originalInput).toBeDefined();
    });
  });
});
