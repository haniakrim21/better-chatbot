import { WebContainer } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export const getWebContainerInstance = async (): Promise<WebContainer> => {
  if (webcontainerInstance) return webcontainerInstance;

  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    // Check if we are in a browser environment
    if (typeof window === "undefined") {
      throw new Error("WebContainer can only be booted in the browser");
    }

    try {
      const { auth } = await import("@webcontainer/api");

      // This is required as per the user's request/documentation for the API key usage
      // Note: auth.init is not always present in all versions or public docs,
      // but user specifically requested this snippet.
      // If auth.init is not available on the imported object, we might need to adjust.
      // However, based on the provided snippet, we assume it exists.

      // We need to type cast or ignore TS error if the types aren't fully up to date with this specific API key flow
      // but let's try to use it naturally first.

      const clientId = process.env.NEXT_PUBLIC_WEBCONTAINER_CLIENT_ID;
      if (clientId && (auth as any).init) {
        (auth as any).init({
          clientId,
          scope: "",
        });
      }

      webcontainerInstance = await WebContainer.boot();
      return webcontainerInstance;
    } catch (error) {
      console.error("Failed to boot WebContainer:", error);
      bootPromise = null; // Reset promise so we can retry
      throw error;
    }
  })();

  return bootPromise;
};
