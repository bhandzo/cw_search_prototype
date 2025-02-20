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

  it("should add search to history when submitted", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText(
      /search by role, industry, skills, or keywords/i
    );
    await user.type(searchInput, "Senior Developer{enter}");

    expect(screen.getByText("Senior Developer")).toBeInTheDocument();
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
