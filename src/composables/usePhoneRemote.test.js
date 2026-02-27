import { describe, expect, it } from "vitest";
import {
  buildRemotePairingUrl,
  readOfferTokenFromSearch
} from "./usePhoneRemote";

describe("readOfferTokenFromSearch", () => {
  it("returns an empty string when no offer token is present", () => {
    expect(readOfferTokenFromSearch("")).toBe("");
    expect(readOfferTokenFromSearch("?remote=1")).toBe("");
  });

  it("extracts and trims the offer token", () => {
    expect(readOfferTokenFromSearch("?remote=1&offer=%20abc123%20")).toBe("abc123");
  });
});

describe("buildRemotePairingUrl", () => {
  it("returns an empty string when offer token is missing", () => {
    expect(
      buildRemotePairingUrl({
        currentUrl: "https://example.com/",
        offerToken: ""
      })
    ).toBe("");
  });

  it("builds a remote pairing link with remote and offer query params", () => {
    const pairingUrl = buildRemotePairingUrl({
      currentUrl: "https://example.com/?foo=bar",
      offerToken: "test-offer-token"
    });

    const parsed = new URL(pairingUrl);
    expect(parsed.searchParams.get("foo")).toBe("bar");
    expect(parsed.searchParams.get("remote")).toBe("1");
    expect(parsed.searchParams.get("offer")).toBe("test-offer-token");
  });

  it("returns an empty string for invalid current urls", () => {
    expect(
      buildRemotePairingUrl({
        currentUrl: "not-a-valid-url",
        offerToken: "abc"
      })
    ).toBe("");
  });
});
