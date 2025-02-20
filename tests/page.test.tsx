import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

describe("Home", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders search interface", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/search by role, industry, skills, or keywords/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("adds search to history and shows structured query", async () => {
    const mockResponse = {
      structuredQuery: {
        role: "Senior Developer",
        skills: ["React", "TypeScript"],
        location: "Remote",
        experience: "5+ years"
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const user = userEvent.setup();
    render(<Home />);
    
    const searchInput = screen.getByPlaceholderText(/search by role, industry, skills, or keywords/i);
    await user.type(searchInput, "test search");
    await user.click(screen.getByRole("button", { name: /search/i }));
    
    expect(screen.getByText("test search")).toBeInTheDocument();
    expect(await screen.findByText("Role: Senior Developer")).toBeInTheDocument();
    expect(await screen.findByText("Skills: React, TypeScript")).toBeInTheDocument();
    expect(await screen.findByText("Location: Remote")).toBeInTheDocument();
    expect(await screen.findByText("Experience: 5+ years")).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith('/api/openai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: "test search" })
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
