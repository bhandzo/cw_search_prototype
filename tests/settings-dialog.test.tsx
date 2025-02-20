import { render, screen, fireEvent, act } from "@testing-library/react";
import { SettingsDialog } from "@/components/settings-dialog";

describe("SettingsDialog", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens automatically when no credentials exist", () => {
    render(<SettingsDialog />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("stays closed if credentials exist", () => {
    localStorage.setItem(
      "credentials",
      JSON.stringify({
        firmSlug: "test",
        firmApiKey: "test",
        clockworkApiKey: "test",
        clockworkApiSecret: "test",
      })
    );
    render(<SettingsDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("saves credentials to localStorage", async () => {
    render(<SettingsDialog />);

    const testCredentials = {
      firmSlug: "test-firm",
      firmApiKey: "test-firm-key",
      clockworkApiKey: "test-clockwork-key",
      clockworkApiSecret: "test-clockwork-secret",
    };

    fireEvent.change(screen.getByLabelText(/firm slug/i), {
      target: { value: testCredentials.firmSlug },
    });
    fireEvent.change(screen.getByLabelText(/firm api key/i), {
      target: { value: testCredentials.firmApiKey },
    });
    fireEvent.change(screen.getByLabelText(/clockwork api key/i), {
      target: { value: testCredentials.clockworkApiKey },
    });
    fireEvent.change(screen.getByLabelText(/clockwork api secret/i), {
      target: { value: testCredentials.clockworkApiSecret },
    });

    fireEvent.click(screen.getByText("Save"));

    const stored = JSON.parse(localStorage.getItem("credentials") || "{}");
    expect(stored).toEqual(testCredentials);
  });
});
