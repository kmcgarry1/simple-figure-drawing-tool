import { describe, expect, it } from "vitest";
import {
  buildRemoteIceServers,
  buildRemotePairingUrl,
  deriveRemoteDiagnostics,
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

describe("buildRemoteIceServers", () => {
  it("always includes the default STUN server", () => {
    const iceServers = buildRemoteIceServers({
      env: {}
    });

    expect(iceServers).toEqual([
      {
        urls: "stun:stun.l.google.com:19302"
      }
    ]);
  });

  it("adds TURN server when url, username, and credential are configured", () => {
    const iceServers = buildRemoteIceServers({
      env: {
        VITE_TURN_URL: "turn:turn.example.com:3478?transport=udp",
        VITE_TURN_USERNAME: "turn-user",
        VITE_TURN_CREDENTIAL: "turn-pass"
      }
    });

    expect(iceServers).toHaveLength(2);
    expect(iceServers[1]).toEqual({
      urls: "turn:turn.example.com:3478?transport=udp",
      username: "turn-user",
      credential: "turn-pass"
    });
  });

  it("ignores partial TURN configuration", () => {
    const iceServers = buildRemoteIceServers({
      env: {
        VITE_TURN_URL: "turn:turn.example.com:3478?transport=udp",
        VITE_TURN_USERNAME: "turn-user",
        VITE_TURN_CREDENTIAL: ""
      }
    });

    expect(iceServers).toEqual([
      {
        urls: "stun:stun.l.google.com:19302"
      }
    ]);
  });
});

describe("deriveRemoteDiagnostics", () => {
  it("returns connected diagnostics when channel is open", () => {
    const diagnostics = deriveRemoteDiagnostics({
      connectionState: "connected",
      iceConnectionState: "connected",
      dataChannelState: "open",
      hasOfferToken: true,
      isRemoteConnected: true,
      hasTurnServer: true
    });

    expect(diagnostics.category).toBe("connected");
    expect(diagnostics.statusLabel).toBe("Connected");
    expect(diagnostics.retryRecommended).toBe(false);
    expect(diagnostics.turnFallbackEnabled).toBe(true);
  });

  it("returns reconnecting diagnostics for transient disconnect", () => {
    const diagnostics = deriveRemoteDiagnostics({
      connectionState: "disconnected",
      iceConnectionState: "disconnected",
      dataChannelState: "closing",
      hasOfferToken: true
    });

    expect(diagnostics.category).toBe("reconnecting");
    expect(diagnostics.errorCategory).toBe("transient-disconnect");
    expect(diagnostics.retryRecommended).toBe(false);
  });

  it("recommends retry when reconnect timeout is reached", () => {
    const diagnostics = deriveRemoteDiagnostics({
      connectionState: "disconnected",
      iceConnectionState: "disconnected",
      dataChannelState: "closed",
      hasOfferToken: true,
      reconnectTimedOut: true
    });

    expect(diagnostics.category).toBe("error");
    expect(diagnostics.errorCategory).toBe("reconnect-timeout");
    expect(diagnostics.retryRecommended).toBe(true);
  });

  it("surfaces explicit error category and hint overrides", () => {
    const diagnostics = deriveRemoteDiagnostics({
      connectionState: "connecting",
      iceConnectionState: "checking",
      dataChannelState: "connecting",
      hasOfferToken: true,
      errorCategory: "invalid-answer-token",
      errorHint: "Answer token is invalid."
    });

    expect(diagnostics.category).toBe("error");
    expect(diagnostics.errorCategory).toBe("invalid-answer-token");
    expect(diagnostics.hint).toBe("Answer token is invalid.");
    expect(diagnostics.retryRecommended).toBe(true);
  });
});
