import { HttpClient } from "@angular/common/http";
import { afterNextRender, inject, Injectable, signal } from "@angular/core";
import { firstValueFrom, timeout } from "rxjs";
import { API_ENDPOINTS } from "@core/http/api-endpoints";
import {
  currentInflationSchema,
  inflationHistorySchema,
  type CurrentInflation,
  type InflationPoint,
} from "@contracts/inflation";

@Injectable({ providedIn: "root" })
export class InflationService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = inject(API_ENDPOINTS).inflation;
  readonly current = signal<CurrentInflation | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  constructor() {
    afterNextRender(() => {
      void this.load();
    });
  }
  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(false);
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: unknown }>(this.endpoint).pipe(timeout(20000)),
      );
      this.current.set(currentInflationSchema.parse(response.data));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  async history(datasetId: string): Promise<InflationPoint[]> {
    const points: InflationPoint[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 8; page++) {
      const params: Record<string, string> = {
        action: "history",
        datasetId,
        ...(cursor ? { cursor } : {}),
      };
      const response = await firstValueFrom(
        this.http
          .get<{ data: unknown }>(this.endpoint, { params })
          .pipe(timeout(20000)),
      );
      const data = inflationHistorySchema.parse(response.data);
      if (
        data.datasetId !== datasetId ||
        data.points.some(
          (p, i) =>
            (i > 0 && p.period <= data.points[i - 1].period) ||
            (cursor !== null && p.period <= cursor),
        )
      )
        throw new Error("Inconsistent history");
      points.push(...data.points);
      if (!data.nextCursor) return points;
      if (data.nextCursor !== data.points.at(-1)?.period)
        throw new Error("Invalid history cursor");
      cursor = data.nextCursor;
    }
    throw new Error("History exceeds supported size");
  }
}
