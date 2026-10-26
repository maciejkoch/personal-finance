import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_ENDPOINTS, PRODUCTION_API_ENDPOINTS } from "./api-endpoints";
import { AppCheckService } from "./app-check.service";
import { appCheckInterceptor } from "./app-check.interceptor";

describe("App Check HTTP tokens", () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let token: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    token = vi.fn().mockResolvedValue("attested-token");
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([appCheckInterceptor])),
        provideHttpClientTesting(),
        { provide: API_ENDPOINTS, useValue: PRODUCTION_API_ENDPOINTS },
        { provide: AppCheckService, useValue: { token } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });
  afterEach(() => http.verify());
  it("attaches a token to each configured endpoint with query parameters", async () => {
    for (const endpoint of Object.values(PRODUCTION_API_ENDPOINTS)) {
      const url = endpoint + "?action=catalog";
      client.get(url).subscribe();
      await vi.waitFor(() => expect(token).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 0));
      const request = http.expectOne(url);
      expect(request.request.headers.get("X-Firebase-AppCheck")).toBe(
        "attested-token",
      );
      request.flush({});
    }
  });
  it("does not leak tokens to foreign URLs, lookalike paths or local assets", () => {
    for (const url of [
      "https://evil.example/test",
      PRODUCTION_API_ENDPOINTS.savings + "/evil",
      PRODUCTION_API_ENDPOINTS.savings + ".evil",
      "/app-check.json",
    ]) {
      client.get(url).subscribe();
      const request = http.expectOne(url);
      expect(request.request.headers.has("X-Firebase-AppCheck")).toBe(false);
      request.flush({});
    }
    expect(token).not.toHaveBeenCalled();
  });
  it("sends requests without a token when protection is off or monitoring fails", async () => {
    token.mockResolvedValue(null);
    client.get(PRODUCTION_API_ENDPOINTS.savings).subscribe();
    await vi.waitFor(() => {
      const request = http.expectOne(PRODUCTION_API_ENDPOINTS.savings);
      expect(request.request.headers.has("X-Firebase-AppCheck")).toBe(false);
      request.flush({});
    });
  });
  it("does not send a request when token acquisition fails in enforce mode", async () => {
    token.mockRejectedValue(new Error("attestation unavailable"));
    let error: unknown;
    client.get(PRODUCTION_API_ENDPOINTS.savings).subscribe({
      error: (value) => {
        error = value;
      },
    });
    await vi.waitFor(() => expect(error).toBeInstanceOf(Error));
    http.expectNone(PRODUCTION_API_ENDPOINTS.savings);
  });
});
