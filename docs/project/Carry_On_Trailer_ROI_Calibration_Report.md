# Carry-On Trailer: ROI Model Calibration Packet

**Date:** February 27, 2026
**Author:** Manus AI

## 1. Executive Summary

This document provides a defensible, source-backed set of baseline estimates for the 20 key variables required to calibrate the Carry-On Trailer logistics and CRM ROI model. Each variable includes a recommended baseline, a low/high range, a confidence rating, and detailed source citations and rationale.

The analysis triangulates data from primary sources (company press releases), secondary sources (S&P Global ratings reports, industry publications), and tertiary sources (business databases), reconciling conflicting information to produce a consistent and defensible model foundation.

### Recommended Baseline Sets

| Scenario | Annual Revenue | Realized Revenue/Trailer | Annual Units Sold | Gross Margin % | Freight Rate/Mile | Truck Utilization % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Realistic (Baseline)** | **$225M** | **$2,500** | **90,000** | **22%** | **$2.65** | **50%** |
| **Conservative** | $175M | $2,000 | 70,000 | 18% | $2.95 | 45% |
| **Optimistic** | $300M | $3,000 | 100,000 | 25% | $2.40 | 55% |

### Top 5 Uncertainty Risks

1.  **Carry-On Brand-Level Revenue:** As a subsidiary of the privately held American Trailer World (ATW), Carry-On's specific revenue is not publicly disclosed. The baseline of $225M is a triangulation of database estimates and bottom-up production models, carrying **Medium Confidence**.
2.  **Realized Revenue Per Trailer:** The true manufacturer-level revenue per unit is heavily dependent on the product mix (utility vs. enclosed/dump) and retailer margins. The $2,500 baseline is an inference and carries **Low Confidence**.
3.  **Annual Units Sold:** While production capacity can be estimated, actual sales volume fluctuates with market demand. The 90,000 unit baseline is derived from the revenue and price-per-trailer estimates, making it an output rather than a primary input.
4.  **CRM & Commercial Metrics:** Variables like `Annual Qualified Opportunities`, `Win Rate`, and `Cross-Sell Revenue` are internal metrics with no public data. Baselines are derived from general B2B manufacturing benchmarks and carry **Low Confidence**.
5.  **Logistics Micro-Variables:** Specifics like `Change-Order Rate` and `Premium` are based on user-provided context and industry norms, not direct data, warranting **Medium to Low Confidence**.

---

## 2. Variable Table

### A) Revenue Calibration

| Variable | Recommended Baseline | Low | High | Confidence | Source(s) | Notes / Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Annual company revenue | **$225,000,000** | $175M | $325M | Medium | [1][2][3] | Triangulated from multiple tertiary databases (Zippia, GrowJo, ZoomInfo) and reconciled with top-down ATW parent revenue context. See Calculation Notes. |
| Realized revenue per trailer | **$2,500** | $1,800 | $3,500 | Low | [4][5] | Inferred by dividing the triangulated annual revenue by the estimated annual units sold. Assumes a blended product mix. |
| Annual units sold | **90,000** | 60,000 | 100,000 | Medium | [6][7] | Derived from production capacity estimates (6-7 plants, ~50 trailers/day) and reconciled with revenue/price per unit. |
| Sell-through % of produced units | **92%** | 85% | 97% | Low | [8] | Inferred based on the company's build-to-order model through major retailers, which minimizes finished goods inventory. |

### B) Manufacturing / Volume Baselines

| Variable | Recommended Baseline | Low | High | Confidence | Source(s) | Notes / Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Number of plants in operation | **7** | 6 | 8 | High | [6][7] | Multiple press releases and news articles from 2024 confirm seven manufacturing facilities. |
| Trailers produced per plant per day | **50** | 35 | 65 | Medium | [9] | Based on user-provided context, which is plausible for a plant of this type. |
| Working days per year | **250** | 240 | 260 | High | [10] | Standard assumption for US-based manufacturing operations. |

### C) Logistics Cost Baselines

| Variable | Recommended Baseline | Low | High | Confidence | Source(s) | Notes / Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Trailers per truck at full load | **4** | 3 | 6 | Medium | [11] | Industry standard for stacking/hauling smaller utility trailers on a 53' flatbed. |
| Current truck utilization % | **50%** | 40% | 60% | Medium | [9] | Based on user-provided context, a key driver for the transformation initiative. |
| Average haul distance (miles) | **500** | 300 | 750 | Medium | [12] | Aligns with national average truckload haul distances and plant-to-retailer geography. |
| Freight rate per mile | **$2.65** | $2.20 | $3.20 | High | [13][14] | Based on DAT and other freight market data for contract flatbed rates in 2024/2025. |
| Current empty miles % | **20%** | 15% | 30% | Medium | [15] | Slightly higher than the 16.7% industry average (ATRI) to account for one-way outbound shipping model. |
| Change-order rate % | **15%** | 8% | 25% | Medium | [9] | Based on user-provided context. Plausible for a build-to-order manufacturing environment. |
| Change-order premium % | **20%** | 10% | 35% | Low | [16] | Industry norm for last-minute freight changes, but not specifically sourced for Carry-On. |

### D) Commercial/CRM Baselines

| Variable | Recommended Baseline | Low | High | Confidence | Source(s) | Notes / Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Annual qualified opportunities | **300** | 150 | 500 | Low | [17] | Inferred based on the size of the dealer/retailer market and potential for network expansion. |
| Baseline win rate % | **30%** | 20% | 45% | Low | [18] | Based on general B2B manufacturing sales win rate benchmarks. |
| Baseline average deal size | **$200,000** | $75,000 | $500,000 | Low | [17] | Estimated annual revenue generated per dealer/retailer account. |
| Baseline gross margin % | **22%** | 15% | 30% | Medium | [19][20] | Based on comparable public company (CIMC Vehicles) and ATW's reported EBITDA margins. |
| Cross-sell annual revenue baseline | **$18,000,000** | $11M | $34M | Low | [21] | Estimated at 8% of total revenue, based on B2B benchmarks for parts/accessories programs. |
| At-risk revenue baseline | **$22,500,000** | $11M | $45M | Low | [22] | Estimated at 10% of total revenue, based on average B2B customer churn/risk rates. |


---

## 3. Calculation Notes

This section details the formulas and logic used to derive key inferred values.

### Annual Revenue Triangulation

The recommended baseline of **$225 million** was determined by reconciling three different estimation methods:

1.  **Top-Down (Parent Company Context):** S&P Global reports indicate ATW (parent) had peak revenue around $1.9B in 2022. As a major consumer brand within the ATW portfolio, Carry-On would represent a significant portion, estimated to be in the $200-$400M range.
2.  **Tertiary Database Aggregation:** Publicly available business databases provide a range of estimates:
    *   Zippia: $250.0M
    *   GrowJo: $205.4M
    *   ZoomInfo/RocketReach: $325.7M
    The average of the lower-end, more recent estimates is approximately **$227M**.
3.  **Bottom-Up (Revenue per Employee):** Using employee counts from databases (500-750) and revenue-per-employee ratios ($333K-$410K), the implied revenue is **$205M to $250M**.

**Conclusion:** The selected baseline of $225M is a conservative midpoint of these triangulated values, acknowledging the lack of primary financial disclosures.

### Realized Revenue Per Trailer

This is a derived metric calculated as:

> `Realized Revenue per Trailer = Annual Revenue / Annual Units Sold`

Using the recommended baselines:

> `$2,500 = $225,000,000 / 90,000`

This figure was cross-checked against a bottom-up estimate based on retail prices at Lowe's and Tractor Supply Co. The average retail price for a high-volume utility trailer is ~$1,800. Assuming a 30-35% retailer margin, the manufacturer-realized revenue would be $1,170-$1,260. The higher baseline of $2,500 accounts for a product mix that includes higher-priced enclosed, dump, and equipment trailers, which sell for $3,000-$6,000+ at retail.

### Sell-Through Percentage

This is an assumption based on the business model. Carry-On primarily manufactures trailers that have already been ordered by a retailer or end customer (build-to-order). This model inherently minimizes the risk of overproduction and unsold inventory compared to a build-to-stock model. A 92% sell-through rate assumes that nearly all produced units are sold within the same fiscal year, with a small percentage remaining as floor models, in-transit inventory, or carry-over.

---

## 4. Source Register

[1] Zippia. "Carry-On Trailer Revenue." Accessed February 27, 2026. https://www.zippia.com/carry-on-trailer-careers-18254/revenue/

[2] Growjo. "Carry-On Trailer Corp Revenue." Accessed February 27, 2026. https://growjo.com/company/Carry-On_Trailer_Corp

[3] ZoomInfo. "Carry-On Trailer Corp Overview." Accessed February 27, 2026. https://www.zoominfo.com/c/carry-on-trailer-corp/21286607

[4] Lowe's. "Carry-On Trailer at Lowes.com." Accessed February 27, 2026. https://www.lowes.com/pl/truck-towing/trailers/carry-on-trailer/2020411626031-4294867223

[5] Tractor Supply Co. "Carry-On Trailer 5 ft. x 8 ft. Mesh Floor Utility Trailer." Accessed February 27, 2026. https://www.tractorsupply.com/tsc/product/carry-on-trailer-5-ft-x-8-ft-open-mesh-floor-utility-trailer

[6] Virginia Economic Development Partnership. "National Utility Trailer Manufacturer Carry-On Trailer to Expand in Westmoreland County." June 11, 2024. https://www.vedp.org/press-release/2024-06/carryontrailer-westmoreland-0

[7] Virginia Business. "Carry-On Trailer expands Westmoreland operation." June 13, 2024. https://virginiabusiness.com/carry-on-trailer-expands-westmoreland-operation/

[8] Industry Practice (Inference). Based on build-to-order manufacturing models.

[9] User-Provided Context. Based on initial project briefing and operational details.

[10] Standard Assumption. Based on typical US manufacturing calendar.

[11] Industry Practice (Inference). Based on standard flatbed trailer loading configurations for utility trailers.

[12] FreightWaves. "Truckload's diminishing distance." July 26, 2025. https://www.freightwaves.com/news/truckloads-diminishing-distance

[13] DAT. "National Flatbed Rates." Accessed February 27, 2026. https://www.dat.com/trendlines/flatbed/national-rates

[14] Scale Funding. "Current Freight Rates." Accessed February 27, 2026. https://getscalefunding.com/resources/current-freight-rates/

[15] American Transportation Research Institute (ATRI). "Operational Costs of Trucking." July 2025. https://truckingresearch.org/2025/07/new-atri-report-shows-trucking-profitability-severly-squeezed-by-high-costs-low-rates/

[16] Industry Practice (Inference). Based on common carrier charges for freight plan modifications.

[17] Industry Practice (Inference). Based on typical B2B sales funnels in durable goods manufacturing.

[18] Sales Motion. "Sales Win Rate: How to Calculate and Benchmark in 2026." February 17, 2026. https://salesmotion.io/blog/sales-win-rate-benchmarks-2026

[19] S&P Global Ratings. "American Trailer World Corp. Outlook Revised To Stable From Negative." February 23, 2024. https://www.spglobal.com/ratings/en/regulatory/article/-/view/type/HTML/id/3129635

[20] Global Trailer Magazine. "CIMC Vehicles reports healthy 2024 profits." April 1, 2025. https://www.globaltrailermag.com/cimc-reports-healthy-2024-profits/

[21] DigGrowth. "Cross-sell Rate: Formula, Benchmark & Steps To Improve." Accessed February 27, 2026. https://diggrowth.com/kpi/cross-sell-rate/

[22] CustomerGauge. "What's the Average Churn Rate by Industry?" Accessed February 27, 2026. https://customergauge.com/blog/average-churn-rate-by-industry
