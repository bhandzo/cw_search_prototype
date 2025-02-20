import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog } from "@/components/settings-dialog";

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Settings: () => <div data-testid="settings-icon" />,
  X: () => <div data-testid="close-icon" />
}));

// Mock the localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key],
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("SettingsDialog", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("should render settings button", () => {
    render(<SettingsDialog />);
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
  });

  it("should open dialog when no credentials exist", () => {
    render(<SettingsDialog />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should stay closed if credentials exist", () => {
    localStorageMock.setItem(
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

  it("should save credentials to localStorage", async () => {
    const user = userEvent.setup();
    render(<SettingsDialog />);

    const testCredentials = {
      firmSlug: "test-firm",
      firmApiKey: "test-firm-key",
      clockworkApiKey: "test-clockwork-key",
      clockworkApiSecret: "test-clockwork-secret",
    };

    await user.type(screen.getByLabelText(/firm slug/i), testCredentials.firmSlug);
    await user.type(screen.getByLabelText(/firm api key/i), testCredentials.firmApiKey);
    await user.type(screen.getByLabelText(/clockwork api key/i), testCredentials.clockworkApiKey);
    await user.type(screen.getByLabelText(/clockwork api secret/i), testCredentials.clockworkApiSecret);

    await user.click(screen.getByText("Save"));

    const stored = JSON.parse(localStorageMock.getItem("credentials") || "{}");
    expect(stored).toEqual(testCredentials);
  });
});
