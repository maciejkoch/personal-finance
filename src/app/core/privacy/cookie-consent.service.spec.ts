import { DOCUMENT } from "@angular/common";
import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { CookieConsentService } from "./cookie-consent.service";

const KEY = "oszczedzify:cookie-consent:v1";
const AGE = 180 * 24 * 60 * 60 * 1000;

describe("CookieConsentService", () => {
  let page: Document;
  let browser: {
    localStorage: Storage;
    location: { reload: ReturnType<typeof vi.fn> };
    dataLayer?: IArguments[];
    "ga-disable-G-TQCS9KZ14L"?: boolean;
  };

  beforeEach(() => {
    localStorage.clear();
    const dom = document.implementation.createHTMLDocument();
    browser = { localStorage, location: { reload: vi.fn() } };
    page = {
      defaultView: browser,
      location: { hostname: "oszczedzify.org", pathname: "/kalkulatory" },
      cookie: "",
      head: dom.head,
      createElement: dom.createElement.bind(dom),
      querySelector: dom.querySelector.bind(dom),
      querySelectorAll: dom.querySelectorAll.bind(dom),
    } as unknown as Document;
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: page }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function start() {
    const consent = TestBed.inject(CookieConsentService);
    consent.initialize();
    return consent;
  }

  it("blocks Google tags until explicit consent and remembers rejection", () => {
    const consent = start();
    expect(consent.bannerVisible()).toBe(true);
    expect(page.querySelector("script")).toBeNull();
    consent.choose(false);
    expect(consent.bannerVisible()).toBe(false);
    expect(page.querySelector("script")).toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY)!)).toMatchObject({
      analytics: false,
    });
    expect(browser.location.reload).not.toHaveBeenCalled();
  });

  it("loads a single tag after acceptance with advertising disabled", () => {
    const consent = start();
    consent.choose(true);
    consent.choose(true);
    consent.initialize();
    expect(page.querySelectorAll("script")).toHaveLength(1);
    expect(page.querySelector("script")!.src).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-TQCS9KZ14L",
    );
    expect(browser.dataLayer!.map((args) => Array.from(args))).toEqual([
      [
        "consent",
        "default",
        {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        },
      ],
      ["consent", "update", { analytics_storage: "granted" }],
      ["js", expect.any(Date)],
      [
        "config",
        "G-TQCS9KZ14L",
        {
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        },
      ],
    ]);
  });

  it.each([true, false])("restores a saved choice of %s", (analytics) => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ analytics, savedAt: Date.now() }),
    );
    const consent = start();
    expect(consent.bannerVisible()).toBe(false);
    expect(page.querySelectorAll("script")).toHaveLength(analytics ? 1 : 0);
  });

  it.each([
    "broken",
    "null",
    "true",
    '{"analytics":"true"}',
    JSON.stringify({ analytics: true, savedAt: Date.now() - AGE }),
    JSON.stringify({ analytics: true, savedAt: Date.now() + AGE }),
  ])("requires a new choice for invalid or expired storage: %s", (value) => {
    localStorage.setItem(KEY, value);
    expect(start().bannerVisible()).toBe(true);
    expect(page.querySelector("script")).toBeNull();
  });

  it("works when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const consent = start();
    expect(consent.bannerVisible()).toBe(true);
    expect(() => consent.choose(false)).not.toThrow();
    expect(page.querySelector("script")).toBeNull();
    expect(() => consent.choose(true)).not.toThrow();
    expect(page.querySelectorAll("script")).toHaveLength(1);
  });

  it("disables analytics, expires GA cookies and reloads when consent is withdrawn", () => {
    const consent = start();
    consent.choose(true);
    Object.defineProperty(page, "cookie", {
      configurable: true,
      get: () => "_ga=old; _ga_TQCS9KZ14L=old; calculator=keep",
      set: vi.fn(),
    });
    const cookies = vi.spyOn(page, "cookie", "set");
    consent.choose(false);
    expect(browser["ga-disable-G-TQCS9KZ14L"]).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toMatchObject({
      analytics: false,
    });
    expect(cookies).toHaveBeenCalledWith(
      "_ga=; Max-Age=0; path=/; domain=oszczedzify.org",
    );
    expect(cookies).toHaveBeenCalledWith("_ga_TQCS9KZ14L=; Max-Age=0; path=/");
    expect(
      cookies.mock.calls.every(([value]) => !value.startsWith("calculator=")),
    ).toBe(true);
    expect(browser.location.reload).toHaveBeenCalledOnce();
  });

  it("removes stale acceptance if writing the rejection fails", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ analytics: true, savedAt: Date.now() }),
    );
    const consent = start();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    consent.choose(false);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(browser["ga-disable-G-TQCS9KZ14L"]).toBe(true);
    expect(browser.location.reload).toHaveBeenCalledOnce();
  });

  it("keeps analytics disabled without reloading into stale read-only consent", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ analytics: true, savedAt: Date.now() }),
    );
    const consent = start();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("read-only");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("read-only");
    });
    consent.choose(false);
    expect(browser["ga-disable-G-TQCS9KZ14L"]).toBe(true);
    expect(browser.location.reload).not.toHaveBeenCalled();
  });

  it("does not touch browser storage or load tags during server rendering", () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: "server" });
    const read = vi.spyOn(Storage.prototype, "getItem");
    expect(start().bannerVisible()).toBe(false);
    expect(read).not.toHaveBeenCalled();
    expect(page.querySelector("script")).toBeNull();
  });
});
