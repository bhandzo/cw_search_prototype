import { POST as clockworkSearch } from "@/app/api/clockwork-search/route";
import { POST as openAiSearch } from "@/app/api/openai-search/route";
import { createMocks } from "node-mocks-http";
import handler from "../src/app/api/clockwork-search/route"; // Adjust the import path as needed
import fetch, { RequestInfo, RequestInit, Response } from "node-fetch";

// Mock the global fetch function
global.fetch = fetch as unknown as (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

// Mock Request
const mockRequest = (body: any) => {
  return {
    json: async () => body,
  } as Request;
};

describe("API Routes", () => {
  describe("/api/clockwork-search", () => {
    it("returns mock candidate data", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          query: "Senior Developer",
          apiKey: "test-key",
          firmApiKey: "test-firm-key",
          firmSlug: "test-firm",
        },
      });

      await clockworkSearch(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.candidates).toBeDefined();
      expect(data.candidates.length).toBeGreaterThan(0);
      expect(data.candidates[0]).toHaveProperty("name");
    });
  });

  describe("/api/openai-search", () => {
    it("returns structured query from user input", async () => {
      const request = mockRequest({
        userInput: "Find me senior developers with React experience",
        clockworkContext: {},
      });

      const response = await openAiSearch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.structuredQuery).toBeDefined();
      expect(data.originalInput).toBeDefined();
    });
  });
});
