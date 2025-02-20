import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

describe("Search Interface", () => {
  it("should render search bar with placeholder", () => {
    render(<Home />);
    expect(
      screen.getByPlaceholderText(/search by role, industry, skills, or keywords/i)
    ).toBeInTheDocument();
  });

  it("should add search to history and show structured query", async () => {
    const mockResponse = {
      structuredQuery: {
        role: "Senior Developer",
        skills: ["React", "TypeScript"],
        location: "Remote",
        experience: "5+ years"
      }
    };

    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText(
      /search by role, industry, skills, or keywords/i
    );
    await user.type(searchInput, "Senior Developer{enter}");

    // Original query should be visible
    expect(screen.getByText("Senior Developer")).toBeInTheDocument();

    // Structured query details should appear
    expect(await screen.findByText("Role: Senior Developer")).toBeInTheDocument();
    expect(await screen.findByText("Skills: React, TypeScript")).toBeInTheDocument();
    expect(await screen.findByText("Location: Remote")).toBeInTheDocument();
    expect(await screen.findByText("Experience: 5+ years")).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith('/api/openai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: "Senior Developer" })
    });
  });

  it("should show error state when API call fails", async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.reject(new Error("API Error"))
    );

    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText(
      /search by role, industry, skills, or keywords/i
    );
    await user.type(searchInput, "Failed Search{enter}");

    expect(await screen.findByText("Error processing query")).toBeInTheDocument();
  });

  it("should clear search input after submission", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText(
      /search by role, industry, skills, or keywords/i
    );
    await user.type(searchInput, "Product Manager{enter}");

    expect(searchInput).toHaveValue("");
  });
});
