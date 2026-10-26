import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { API_ENDPOINTS, PRODUCTION_API_ENDPOINTS } from "./api-endpoints";
import { AppCheckService } from "./app-check.service";

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  initializeAppCheck: vi.fn(),
  getToken: vi.fn(),
}));
vi.mock("firebase/app", () => ({
  getApps: () => [],
  initializeApp: sdk.initializeApp,
}));
vi.mock("firebase/app-check", () => ({
  initializeAppCheck: sdk.initializeAppCheck,
  getToken: sdk.getToken,
  ReCaptchaEnterpriseProvider: class {},
}));

const activeConfig = {
  mode: "enforce",
  siteKey: "site-key",
  firebase: { apiKey: "api-key", appId: "app-id", projectId: "project-id" },
};
describe("App Check browser lifecycle", () => {
  let fetchConfig: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.clearAllMocks();
    fetchConfig = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => activeConfig });
    vi.stubGlobal("fetch", fetchConfig);
    sdk.initializeApp.mockReturnValue({});
    sdk.initializeAppCheck.mockReturnValue({});
    sdk.getToken.mockResolvedValue({ token: "token" });
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: API_ENDPOINTS, useValue: PRODUCTION_API_ENDPOINTS },
      ],
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("shares initialization across parallel requests and asks SDK for fresh tokens each time", async () => {
    const service = TestBed.inject(AppCheckService);
    expect(await Promise.all([service.token(), service.token()])).toEqual([
      "token",
      "token",
    ]);
    expect(fetchConfig).toHaveBeenCalledTimes(1);
    expect(sdk.initializeAppCheck).toHaveBeenCalledTimes(1);
    expect(sdk.initializeAppCheck).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isTokenAutoRefreshEnabled: true }),
    );
    sdk.getToken.mockResolvedValue({ token: "refreshed" });
    expect(await service.token()).toBe("refreshed");
    expect(sdk.getToken).toHaveBeenCalledTimes(3);
  });
  it("does not initialize Firebase when off", async () => {
    fetchConfig.mockResolvedValue({
      ok: true,
      json: async () => ({ mode: "off" }),
    });
    expect(await TestBed.inject(AppCheckService).token()).toBeNull();
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });
  it("skips configuration and SDK on the server and emulator", async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: "server" });
    expect(await TestBed.inject(AppCheckService).token()).toBeNull();
    expect(fetchConfig).not.toHaveBeenCalled();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: "browser" },
        {
          provide: API_ENDPOINTS,
          useValue: { savings: "http://127.0.0.1:5001/test" },
        },
      ],
    });
    expect(await TestBed.inject(AppCheckService).token()).toBeNull();
    expect(fetchConfig).not.toHaveBeenCalled();
  });
  it("allows monitoring failures and blocks enforce failures without reinitializing the SDK", async () => {
    sdk.getToken.mockRejectedValue(new Error("unavailable"));
    const service = TestBed.inject(AppCheckService);
    await expect(service.token()).rejects.toThrow("unavailable");
    sdk.getToken.mockResolvedValue({ token: "recovered" });
    expect(await service.token()).toBe("recovered");
    expect(sdk.initializeAppCheck).toHaveBeenCalledTimes(1);
    TestBed.resetTestingModule();
    fetchConfig.mockResolvedValue({
      ok: true,
      json: async () => ({ ...activeConfig, mode: "monitor" }),
    });
    sdk.getToken.mockRejectedValue(new Error("unavailable"));
    expect(await TestBed.inject(AppCheckService).token()).toBeNull();
  });
  it("fails closed on malformed config and retries a failed configuration fetch", async () => {
    fetchConfig.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ mode: "enfroce" }),
    });
    const service = TestBed.inject(AppCheckService);
    await expect(service.token()).rejects.toThrow();
    expect(await service.token()).toBe("token");
    expect(fetchConfig).toHaveBeenCalledTimes(2);
  });
});
