import React from "react";

/**
 * A simple debug component to test basic React rendering
 */
export const DebugPanel: React.FC = () => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    console.log("DebugPanel mounted successfully");

    // Test that we can access basic browser APIs
    console.log("Window location:", window.location.href);
    console.log("Document title:", document.title);

    // Test that we can find the phaser container
    const phaserContainer = document.getElementById("phaser-container");
    console.log("Phaser container found:", !!phaserContainer);

    if (phaserContainer) {
      console.log("Phaser container dimensions:", {
        width: phaserContainer.offsetWidth,
        height: phaserContainer.offsetHeight,
      });
    }
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded z-50">
      <h3 className="text-lg font-bold mb-2">Debug Panel</h3>
      <div className="space-y-1 text-sm">
        <div>React: ✓ Working</div>
        <div>Environment: {import.meta.env.MODE}</div>
        <div>Counter: {count}</div>
        <button
          className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
          onClick={() => setCount((c) => c + 1)}
        >
          Test Counter
        </button>
        <div className="mt-2 text-xs">
          Check browser console for more details
        </div>
      </div>
    </div>
  );
};
