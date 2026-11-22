# Day 4 catalog performance

Measured 22 November 2026 on the Windows development machine with Node 26.13.0, Vitest 5.1.1, the typed API client, and the MSW handler. The baseline was commit `1f8f4db` with temporary timing marks. The optimized handler used the same request sequence and timing method. Each single-file run made 80 sequential requests over the 5,000-product fixture, cycling all four sort orders and pages 1–80 with no filters. The first 20 requests warmed the process. The table reports the middle sample and nearest upper percentile of the 60 measured requests. Timing marks covered handler CPU stages, excluding network, response encoding, React rendering, and one-time module startup. Temporary timing marks and the profiling test were removed after the measurements.

| Mock catalog stage          | Before median / p95 | After median / p95 | Change                                                                                                                                                       |
| --------------------------- | ------------------: | -----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sort products for request   |    0.403 / 2.328 ms |   0.003 / 0.005 ms | Pre-sort the fixed catalog once for each supported sorting option and preserve the ID tie-break. Requests reuse the ordered references.                      |
| Materialize available stock |    0.225 / 0.398 ms |   0.006 / 0.016 ms | Build response rows only for the selected page. In-stock filtering still consults current availability across all candidate rows before computing the total. |
| Select candidates and page  |    0.199 / 0.389 ms |   0.002 / 0.003 ms | Skip a full scan for unfiltered pages and reuse normalized names for searches. The optimized selection mark includes slicing the page.                       |

Sorting and stock row materialization were the two most expensive measured stages by median and p95. These timings are local mock CPU measurements. The pre-sorted arrays trade startup work and memory for cheaper repeat requests. A deployed backend needs its own load and latency measurements.

## Browser rendering

In headless Chrome 157 with development mocks and a 360 × 800 viewport, browsing showed 5,000 total products and 209 pages. Chrome rendered 24 cards on page 1, eight on page 209, and 24 after navigating back to page 208. Filtering before pagination remains covered by contract and browse tests.

Virtualization renders only the visible portion of a long list. Pagination already bounds the catalog to 24 cards, so no virtualizer was added. The profile measured handler work and supplied no evidence that React memoization would help.
