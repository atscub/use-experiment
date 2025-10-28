import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useExperiment } from "./index";

// Helper to ensure window.experiments is initialized
function initializeExperiments() {
  if (!window.experiments) {
    window.experiments = {};
  }
}

// Helper to set experiment values properly (ensuring proxy is initialized first)
function setExperiment(key: string, value: any) {
  initializeExperiments();
  window.experiments![key] = value;
}

// Helper component to test the hook
function TestComponent<T = boolean>({
  experimentName,
  defaultValue,
  onValue,
}: {
  experimentName: string;
  defaultValue?: T;
  onValue?: (value: T) => void;
}) {
  const value = useExperiment<T>(experimentName, defaultValue);

  React.useEffect(() => {
    onValue?.(value);
  }, [value, onValue]);

  return <div data-testid="value">{String(value)}</div>;
}

describe("useExperiment", () => {
  beforeEach(() => {
    // Clean up window.experiments before each test
    // Note: __useExperimentStore__ is non-configurable, so we can't delete it
    // Instead, we'll just reset window.experiments
    if (window.experiments) {
      // Clear all properties
      Object.keys(window.experiments).forEach((key) => {
        delete window.experiments![key];
      });
    }
  });
  
  describe("Boolean experiments (default behavior)", () => {
    it("returns false by default when experiment is not set", () => {
      const { getByTestId } = render(<TestComponent experimentName="testFlag" />);
      // Use container query to avoid multiple element issues
      expect(getByTestId("value").textContent).toBe("false");
    });

    it("returns custom default value when experiment is not set", () => {
      const { getByTestId } = render(<TestComponent experimentName="testFlag" defaultValue={true} />);
      expect(getByTestId("value").textContent).toBe("true");
    });

    it("returns the experiment value when set", () => {
      initializeExperiments();
      window.experiments!.testFlag = true;
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it('normalizes string "true" to boolean true', () => {
      initializeExperiments();
      window.experiments!.testFlag = "true";
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it('normalizes string "false" to boolean false', () => {
      initializeExperiments();
      setExperiment("testFlag", "false");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("false");
    });

    it('normalizes string "yes" to boolean true', () => {
      initializeExperiments();
      setExperiment("testFlag", "yes");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it('normalizes string "no" to boolean false', () => {
      initializeExperiments();
      setExperiment("testFlag", "no");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("false");
    });

    it('normalizes string "1" to boolean true', () => {
      initializeExperiments();
      setExperiment("testFlag", "1");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it('normalizes string "0" to boolean false', () => {
      initializeExperiments();
      setExperiment("testFlag", "0");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("false");
    });

    it('normalizes string "on" to boolean true', () => {
      initializeExperiments();
      setExperiment("testFlag", "on");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it('normalizes string "off" to boolean false', () => {
      initializeExperiments();
      setExperiment("testFlag", "off");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("false");
    });

    it("handles case-insensitive string values", () => {
      initializeExperiments();
      setExperiment("testFlag", "TRUE");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it("handles string values with whitespace", () => {
      initializeExperiments();
      setExperiment("testFlag", "  true  ");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it("normalizes number 1 to boolean true", () => {
      initializeExperiments();
      setExperiment("testFlag", 1);
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it("normalizes number 0 to boolean false", () => {
      initializeExperiments();
      setExperiment("testFlag", 0);
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("false");
    });

    it("normalizes positive numbers to boolean true", () => {
      initializeExperiments();
      setExperiment("testFlag", 42);
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it("normalizes negative numbers to boolean true", () => {
      initializeExperiments();
      setExperiment("testFlag", -1);
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it("handles NaN by returning default value", () => {
      initializeExperiments();
      setExperiment("testFlag", NaN);
      render(<TestComponent experimentName="testFlag" defaultValue={true} />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it("handles unrecognized strings as truthy", () => {
      initializeExperiments();
      setExperiment("testFlag", "unknown");
      render(<TestComponent experimentName="testFlag" />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });
  });

  describe("Custom type experiments", () => {
    it("returns string values without modification", () => {
      initializeExperiments();
      setExperiment("testFlag", "control");
      render(
        <TestComponent<string>
          experimentName="testFlag"
          defaultValue="default"
        />
      );
      expect(screen.getByTestId("value")).toHaveTextContent("control");
    });

    it("returns number values without modification", () => {
      initializeExperiments();
      setExperiment("testFlag", 42);
      render(
        <TestComponent<number> experimentName="testFlag" defaultValue={0} />
      );
      expect(screen.getByTestId("value")).toHaveTextContent("42");
    });

    it("returns custom default for string type when not set", () => {
      render(
        <TestComponent<string>
          experimentName="testFlag"
          defaultValue="fallback"
        />
      );
      expect(screen.getByTestId("value")).toHaveTextContent("fallback");
    });

    it("returns custom default for number type when not set", () => {
      render(
        <TestComponent<number> experimentName="testFlag" defaultValue={99} />
      );
      expect(screen.getByTestId("value")).toHaveTextContent("99");
    });
  });

  describe("Reactivity", () => {
    it("updates when experiment value changes", async () => {
      initializeExperiments();
      setExperiment("testFlag", false);
      render(<TestComponent experimentName="testFlag" />);

      expect(screen.getByTestId("value")).toHaveTextContent("false");

      act(() => {
        window.experiments!.testFlag = true;
      });

      await waitFor(() => {
        expect(screen.getByTestId("value")).toHaveTextContent("true");
      });
    });

    it("updates when new experiment is added", async () => {
      initializeExperiments();
      initializeExperiments();
      render(<TestComponent experimentName="newFlag" defaultValue={false} />);

      expect(screen.getByTestId("value")).toHaveTextContent("false");

      act(() => {
        window.experiments!.newFlag = true;
      });

      await waitFor(() => {
        expect(screen.getByTestId("value")).toHaveTextContent("true");
      });
    });

    it("updates when experiment is removed", async () => {
      initializeExperiments();
      setExperiment("testFlag", true);
      render(<TestComponent experimentName="testFlag" defaultValue={false} />);

      expect(screen.getByTestId("value")).toHaveTextContent("true");

      act(() => {
        delete window.experiments!.testFlag;
      });

      await waitFor(() => {
        expect(screen.getByTestId("value")).toHaveTextContent("false");
      });
    });

    it("shares updates across multiple components", async () => {
      initializeExperiments();
      setExperiment("sharedFlag", false);

      const { container } = render(
        <>
          <TestComponent experimentName="sharedFlag" />
          <TestComponent experimentName="sharedFlag" />
        </>
      );

      const values = container.querySelectorAll('[data-testid="value"]');
      expect(values[0]).toHaveTextContent("false");
      expect(values[1]).toHaveTextContent("false");

      act(() => {
        window.experiments!.sharedFlag = true;
      });

      await waitFor(() => {
        expect(values[0]).toHaveTextContent("true");
        expect(values[1]).toHaveTextContent("true");
      });
    });
  });

  describe("Edge cases", () => {
    it("handles empty experiment name", () => {
      initializeExperiments();
      setExperiment("", true);
      render(<TestComponent experimentName="" defaultValue={false} />);
      expect(screen.getByTestId("value")).toHaveTextContent("false");
    });

    it("handles null experiment value", () => {
      initializeExperiments();
      setExperiment("testFlag", null);
      render(<TestComponent experimentName="testFlag" defaultValue={true} />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it("handles undefined experiment value", () => {
      initializeExperiments();
      setExperiment("testFlag", undefined);
      render(<TestComponent experimentName="testFlag" defaultValue={true} />);
      expect(screen.getByTestId("value")).toHaveTextContent("true");
    });

    it("works when window.experiments is initially undefined", () => {
      render(<TestComponent experimentName="testFlag" defaultValue={false} />);
      expect(screen.getByTestId("value")).toHaveTextContent("false");
    });

    it("initializes window.experiments if not present", () => {
      render(<TestComponent experimentName="testFlag" />);
      expect(window.experiments).toBeDefined();
    });
  });
});

describe("Multiple experiments", () => {
  it("handles multiple different experiments independently", async () => {
    initializeExperiments();
    setExperiment("flag1", true);
    setExperiment("flag2", false);

    const { container } = render(
      <>
        <div data-experiment="flag1">
          <TestComponent experimentName="flag1" />
        </div>
        <div data-experiment="flag2">
          <TestComponent experimentName="flag2" />
        </div>
      </>
    );

    const flag1Value = container.querySelector(
      '[data-experiment="flag1"] [data-testid="value"]'
    );
    const flag2Value = container.querySelector(
      '[data-experiment="flag2"] [data-testid="value"]'
    );

    expect(flag1Value).toHaveTextContent("true");
    expect(flag2Value).toHaveTextContent("false");

    act(() => {
      window.experiments!.flag1 = false;
    });

    await waitFor(() => {
      expect(flag1Value).toHaveTextContent("false");
    });

    // flag2 should remain unchanged
    expect(flag2Value).toHaveTextContent("false");
  });
});

describe("Cleanup", () => {
  it("unsubscribes on unmount", () => {
    initializeExperiments();
    setExperiment("testFlag", false);
    const { unmount } = render(<TestComponent experimentName="testFlag" />);

    unmount();

    // After unmount, changing the value shouldn't cause issues
    act(() => {
      window.experiments!.testFlag = true;
    });

    // No assertions needed - just verifying no errors occur
    expect(window.experiments!.testFlag).toBe(true);
  });
});
