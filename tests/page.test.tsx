import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

describe("Home", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({
      firmSlug: "test",
      firmApiKey: "test-key",
      clockworkApiKey: "test-key",
      clockworkApiSecret: "test-secret"
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders search interface", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/search by role, industry, skills, or keywords/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("adds search to history and shows candidates", async () => {
    const mockOpenAIResponse = {
      structuredQuery: {
        role: "Senior Developer",
        skills: ["React", "TypeScript"],
        location: "Remote",
        experience: "5+ years"
      }
    };

    const mockClockworkResponse = {
      candidates: [
        {
          id: "123",
          name: "John Doe",
          currentPosition: "Senior Developer",
          location: "San Francisco, CA"
        },
        {
          id: "456",
          name: "Jane Smith",
          currentPosition: "Product Manager",
          location: "New York, NY"
        }
      ]
    };

    // Mock both API calls
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenAIResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClockworkResponse)
      });

    const user = userEvent.setup();
    render(<Home />);
    
    const searchInput = screen.getByPlaceholderText(/search by role, industry, skills, or keywords/i);
    await user.type(searchInput, "test search");
    await user.click(screen.getByRole("button", { name: /search/i }));
    
    // Check that the structured query is shown
    expect(screen.getByText("test search")).toBeInTheDocument();
    expect(await screen.findByText("Role: Senior Developer")).toBeInTheDocument();
    expect(await screen.findByText("Skills: React, TypeScript")).toBeInTheDocument();
    
    // Check that candidates are shown
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(await screen.findByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
    expect(screen.getByText("New York, NY")).toBeInTheDocument();

    // Verify API calls
    expect(global.fetch).toHaveBeenCalledWith('/api/openai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: "test search" })
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/clockwork-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mockOpenAIResponse.structuredQuery,
        firmSlug: "test",
        firmApiKey: "test-key",
        clockworkApiKey: "test-key",
        clockworkApiSecret: "test-secret"
      })
    });
  });

  it("shows error state when API call fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    const user = userEvent.setup();
    render(<Home />);
    
    const searchInput = screen.getByPlaceholderText(/search by role, industry, skills, or keywords/i);
    await user.type(searchInput, "test search");
    await user.click(screen.getByRole("button", { name: /search/i }));
    
    expect(await screen.findByText("Error processing query")).toBeInTheDocument();
  });
});
