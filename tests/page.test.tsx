import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

describe("Home", () => {
  it("renders search interface", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/search by role, industry, skills, or keywords/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("adds search to history", async () => {
    const user = userEvent.setup();
    render(<Home />);
    
    const searchInput = screen.getByPlaceholderText(/search by role, industry, skills, or keywords/i);
    await user.type(searchInput, "test search");
    await user.click(screen.getByRole("button", { name: /search/i }));
    
    expect(screen.getByText("test search")).toBeInTheDocument();
  });
});
