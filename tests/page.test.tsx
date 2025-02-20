import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home", () => {
  it("renders a button", () => {
    render(<Home />);
    const button = screen.getByRole("button", { name: /Hello shadcn\/ui!/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("inline-flex items-center justify-center");
  });
});
