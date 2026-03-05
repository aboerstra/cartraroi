/* ============================================
   Carry-On Trailer ROI Calculator v3.0
   Logistics Transformation — Calculation Engine
   ============================================ */

// ---- State ----
let currentScenario = 'realistic';
let currentKPIView = 'board';
let previousResults = null;
let waterfallChart = null;
let projectionChart = null;

// ---- Scenario Presets ----
const scenarioPresets = {
    conservative: {
        label: 'Conservative',
        description: 'Modest improvements with higher implementation costs. The CFO\'s "worst realistic case."',
        params: {
            utilization_current_pct: 50, utilization_target_pct: 65,
            routing_empty_miles_current_pct: 12, routing_empty_miles_reduction_pct: 8,
            change_order_current_pct: 15, change_order_target_pct: 10,
            implementation_cost: 1500000, annual_platform_cost: 400000
        }
    },
    realistic: {
        label: 'Realistic',
        description: 'Solid improvements matching industry benchmarks. The board presentation number.',
        params: {
            utilization_current_pct: 50, utilization_target_pct: 80,
            routing_empty_miles_current_pct: 12, routing_empty_miles_reduction_pct: 10,
            change_order_current_pct: 15, change_order_target_pct: 5,
            implementation_cost: 1000000, annual_platform_cost: 300000
        }
    },
    optimistic: {
        label: 'Optimistic',
        description: 'Best-case assumptions with aggressive targets. The "art of the possible."',
        params: {
            utilization_current_pct: 50, utilization_target_pct: 95,
            routing_empty_miles_current_pct: 12, routing_empty_miles_reduction_pct: 20,
            change_order_current_pct: 15, change_order_target_pct: 2,
            implementation_cost: 750000, annual_platform_cost: 200000
        }
    }
};

// ---- Helpers ----
function $(id) { return document.getElementById(id); }
function parseNumeric(value) {
    const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
}
function val(id) { return parseNumeric($(id).value); }
function valOr(id, fallback = 0) {
    const el = $(id);
    return el ? parseNumeric(el.value) : fallback;
}
function fmt(n) {
    const sign = n < 0 ? '-' : '';
    return `${sign}$${Math.round(Math.abs(n)).toLocaleString()}`;
}
function fmtM(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    const value = (abs / 1000000).toFixed(abs >= 10000000 ? 0 : 1).replace(/\.0$/, '');
    return `${sign}$${value}M`;
}
function fmtK(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';

    if (abs >= 1000000) return fmtM(n);

    // Keep comma formatting for small thousands for readability.
    if (abs >= 1000 && abs < 10000) {
        return `${sign}$${Math.round(abs).toLocaleString()}`;
    }

    if (abs >= 1000) {
        const thousands = abs / 1000;
        const decimals = thousands >= 100 ? 0 : thousands >= 10 ? 1 : 2;
        const compact = thousands
            .toFixed(decimals)
            .replace(/\.0+$/, '')
            .replace(/(\.\d*[1-9])0+$/, '$1');
        return `${sign}$${compact}K`;
    }

    return `${sign}$${Math.round(abs).toLocaleString()}`;
}
function fmtPct(n) { return Math.round(n) + '%'; }
function fmtNum(n) { return Math.round(n).toLocaleString(); }

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function syncTargetsFromChangeSliders() {
    const utilCurrent = val('utilization_current_pct');
    const utilChange = val('util_improvement_pct');
    const coCurrent = val('change_order_current_pct');
    const coReduction = val('co_reduction_pct');

    const utilTarget = clamp(utilCurrent * (1 + utilChange / 100), utilCurrent, 100);
    const coTarget = clamp(coCurrent * (1 - coReduction / 100), 0, coCurrent);

    $('utilization_target_pct').value = utilTarget;
    $('change_order_target_pct').value = coTarget;
}

function syncChangeSlidersFromTargets() {
    const utilCurrent = val('utilization_current_pct');
    const utilTarget = val('utilization_target_pct');
    const coCurrent = val('change_order_current_pct');
    const coTarget = val('change_order_target_pct');

    const utilChange = utilCurrent > 0 ? ((utilTarget - utilCurrent) / utilCurrent) * 100 : 0;
    const coReduction = coCurrent > 0 ? ((coCurrent - coTarget) / coCurrent) * 100 : 0;

    $('util_improvement_pct').value = clamp(utilChange, 0, 100);
    $('co_reduction_pct').value = clamp(coReduction, 0, 100);
}

// ---- Core Calculation ----
function calculateROI(overrides) {
    // Read inputs (or use overrides for scenario comparison)
    const p = overrides || {};
    const num_plants = p.num_plants ?? val('num_plants');
    const trailers_per_plant_day = p.trailers_per_plant_day ?? val('trailers_per_plant_day');
    const working_days_year = p.working_days_year ?? val('working_days_year');
    const trailers_per_truck_capacity = p.trailers_per_truck_capacity ?? val('trailers_per_truck_capacity');
    const avg_haul_miles = p.avg_haul_miles ?? val('avg_haul_miles');
    const freight_rate_per_mile = p.freight_rate_per_mile ?? val('freight_rate_per_mile');
    const change_order_premium_pct = (p.change_order_premium_pct ?? val('change_order_premium_pct')) / 100;
    const sell_through_pct = (p.sell_through_pct ?? val('sell_through_pct')) / 100;
    const realized_revenue_per_trailer = p.realized_revenue_per_trailer ?? val('realized_revenue_per_trailer');

    const utilization_current_pct = (p.utilization_current_pct ?? val('utilization_current_pct')) / 100;
    const utilization_target_pct = (p.utilization_target_pct ?? val('utilization_target_pct')) / 100;
    const routing_empty_miles_current_pct = (p.routing_empty_miles_current_pct ?? val('routing_empty_miles_current_pct')) / 100;
    const routing_empty_miles_reduction_pct = (p.routing_empty_miles_reduction_pct ?? val('routing_empty_miles_reduction_pct')) / 100;
    const routing_improvement_pct = routing_empty_miles_current_pct * routing_empty_miles_reduction_pct;
    const change_order_current_pct = (p.change_order_current_pct ?? val('change_order_current_pct')) / 100;
    const change_order_target_pct = (p.change_order_target_pct ?? val('change_order_target_pct')) / 100;

    const implementation_cost = p.implementation_cost ?? val('implementation_cost');
    const annual_platform_cost = p.annual_platform_cost ?? val('annual_platform_cost');

    // Commercial / channel / service value drivers (v4.1 native)
    const annual_qualified_opportunities = p.annual_qualified_opportunities ?? val('annual_qualified_opportunities');
    const marketing_pipeline_lift_pct = (p.marketing_pipeline_lift_pct ?? val('marketing_pipeline_lift_pct')) / 100;
    const avg_deal_size = p.avg_deal_size ?? val('avg_deal_size');
    const deal_size_change_pct = (p.deal_size_change_pct ?? val('deal_size_change_pct')) / 100;
    const cross_sell_annual_revenue = p.cross_sell_annual_revenue ?? val('cross_sell_annual_revenue');
    const cross_sell_lift_pct = (p.cross_sell_lift_pct ?? val('cross_sell_lift_pct')) / 100;

    const dealer_churn_current_pct = (p.dealer_churn_current_pct ?? valOr('dealer_churn_current_pct', 12)) / 100;
    const dealer_churn_reduction_pct = (p.dealer_churn_reduction_pct ?? valOr('dealer_churn_reduction_pct', 15)) / 100;
    const warranty_claim_processing_cost_current = p.warranty_claim_processing_cost_current ?? valOr('warranty_claim_processing_cost_current', 1500000);
    const warranty_claim_processing_reduction_pct = (p.warranty_claim_processing_reduction_pct ?? valOr('warranty_claim_processing_reduction_pct', 25)) / 100;
    const service_technician_utilization_current_pct = (p.service_technician_utilization_current_pct ?? valOr('service_technician_utilization_current_pct', 70)) / 100;
    const service_technician_utilization_lift_pct = (p.service_technician_utilization_lift_pct ?? valOr('service_technician_utilization_lift_pct', 10)) / 100;
    const discount_rate_wacc_pct = (p.discount_rate_wacc_pct ?? valOr('discount_rate_wacc_pct', 10)) / 100;

    // Role productivity value drivers
    const prod_customer_sales_cost = p.prod_customer_sales_cost ?? valOr('prod_customer_sales_cost', 2350000);
    const prod_customer_sales_eff_pct = (p.prod_customer_sales_eff_pct ?? valOr('prod_customer_sales_eff_pct', 25)) / 100;
    const prod_customer_sales_realization_pct = (p.prod_customer_sales_realization_pct ?? valOr('prod_customer_sales_realization_pct', 80)) / 100;
    const prod_operations_cost = p.prod_operations_cost ?? valOr('prod_operations_cost', 1050000);
    const prod_operations_eff_pct = (p.prod_operations_eff_pct ?? valOr('prod_operations_eff_pct', 32)) / 100;
    const prod_operations_realization_pct = (p.prod_operations_realization_pct ?? valOr('prod_operations_realization_pct', 80)) / 100;
    const prod_support_cost = p.prod_support_cost ?? valOr('prod_support_cost', 560000);
    const prod_support_eff_pct = (p.prod_support_eff_pct ?? valOr('prod_support_eff_pct', 40)) / 100;
    const prod_support_realization_pct = (p.prod_support_realization_pct ?? valOr('prod_support_realization_pct', 80)) / 100;

    // Step 1: Volume
    const totalAnnualTrailers = num_plants * trailers_per_plant_day * working_days_year;
    const annualSoldTrailers = totalAnnualTrailers * sell_through_pct;
    const annual_company_revenue = annualSoldTrailers * realized_revenue_per_trailer;

    // Step 2: Current State
    const currentLoads = totalAnnualTrailers / (trailers_per_truck_capacity * utilization_current_pct);
    const currentFreightCost = currentLoads * avg_haul_miles * freight_rate_per_mile;
    const currentChangeOrderCost = currentFreightCost * change_order_current_pct * change_order_premium_pct;
    const totalCurrentCost = currentFreightCost + currentChangeOrderCost;

    // Step 3: Target State (CORRECTED: change orders use post-routing cost)
    const targetLoads = totalAnnualTrailers / (trailers_per_truck_capacity * utilization_target_pct);
    const costAfterCapacity = targetLoads * avg_haul_miles * freight_rate_per_mile;
    const costAfterRouting = costAfterCapacity * (1 - routing_improvement_pct);
    const targetChangeOrderCost = costAfterRouting * change_order_target_pct * change_order_premium_pct;
    const totalTargetCost = costAfterRouting + targetChangeOrderCost;

    // Step 4: Savings & ROI
    const grossSavings = totalCurrentCost - totalTargetCost;
    const netSavings = grossSavings - annual_platform_cost;
    const paybackMonths = netSavings > 0 ? (implementation_cost / netSavings) * 12 : Infinity;
    const totalInvestment5yr = implementation_cost + (annual_platform_cost * 5);
    const roi5year = totalInvestment5yr > 0 ? ((netSavings * 5) - implementation_cost) / totalInvestment5yr * 100 : 0;

    // Step 5: Savings breakdown (for waterfall)
    const capacitySavings = currentFreightCost - costAfterCapacity;
    const routingSavings = costAfterCapacity - costAfterRouting;
    const changeOrderSavings = currentChangeOrderCost - targetChangeOrderCost;

    // Step 6: Operational Metrics
    const loadsEliminated = currentLoads - targetLoads;
    const currentChangeOrders = currentLoads * change_order_current_pct;
    const targetChangeOrders = targetLoads * change_order_target_pct;
    const changeOrdersAvoided = currentChangeOrders - targetChangeOrders;
    const currentMiles = currentLoads * avg_haul_miles;
    const targetMiles = targetLoads * avg_haul_miles * (1 - routing_improvement_pct);
    const milesEliminated = currentMiles - targetMiles;

    // Step 7: Sensitivity (50% achievement)
    const sensitivityGross = grossSavings * 0.5;
    const sensitivityNet = sensitivityGross - annual_platform_cost;
    const sensitivityPayback = sensitivityNet > 0 ? (implementation_cost / sensitivityNet) * 12 : Infinity;
    const sensitivityROI = totalInvestment5yr > 0 ? ((sensitivityNet * 5) - implementation_cost) / totalInvestment5yr * 100 : 0;

    // Step 7b: v4.1 commercial/channel/service value modules
    const avgDealSizeTarget = avg_deal_size;
    const crossSellRevenueTarget = cross_sell_annual_revenue * (1 + cross_sell_lift_pct);

    const newDealerRecruitmentValue = annual_qualified_opportunities * marketing_pipeline_lift_pct * avgDealSizeTarget;
    const existingDealerBaseRevenue = annual_company_revenue;
    const dealerWalletShareGrowthValue = existingDealerBaseRevenue * deal_size_change_pct;
    const atRiskDealerRevenueBase = existingDealerBaseRevenue;
    const dealerChurnTargetPct = dealer_churn_current_pct * (1 - dealer_churn_reduction_pct);
    const dealerChurnReductionValue = atRiskDealerRevenueBase * (dealer_churn_current_pct - dealerChurnTargetPct);
    const warrantyCostReduction = warranty_claim_processing_cost_current * warranty_claim_processing_reduction_pct;
    const serviceEfficiencyValue = warrantyCostReduction;
    const retentionValue = dealerChurnReductionValue;
    const marketingPipelineValue = newDealerRecruitmentValue;
    const salesWinLiftValue = 0;
    const crossSellValue = dealerWalletShareGrowthValue;
    const totalCommercialProgramValue = newDealerRecruitmentValue + dealerWalletShareGrowthValue + dealerChurnReductionValue;
    const crmGrossValue = totalCommercialProgramValue + serviceEfficiencyValue;

    const customerSalesProductivityValue = prod_customer_sales_cost * prod_customer_sales_eff_pct * prod_customer_sales_realization_pct;
    const operationsProductivityValue = prod_operations_cost * prod_operations_eff_pct * prod_operations_realization_pct;
    const supportProductivityValue = prod_support_cost * prod_support_eff_pct * prod_support_realization_pct;
    const totalRoleProductivityValue = customerSalesProductivityValue + operationsProductivityValue + supportProductivityValue;

    const projected_annual_revenue = annual_company_revenue + newDealerRecruitmentValue + dealerWalletShareGrowthValue + dealerChurnReductionValue;
    const projectedRevenueLiftPct = annual_company_revenue > 0
        ? ((projected_annual_revenue - annual_company_revenue) / annual_company_revenue) * 100
        : 0;

    // Integrated value view
    const integratedGrossSavings = grossSavings + crmGrossValue + totalRoleProductivityValue;
    const integratedNetSavings = integratedGrossSavings - annual_platform_cost;
    const integratedROI5year = totalInvestment5yr > 0 ? ((integratedNetSavings * 5) - implementation_cost) / totalInvestment5yr * 100 : 0;
    const netAnnualValuePctRevenue = annual_company_revenue > 0 ? (integratedNetSavings / annual_company_revenue) * 100 : 0;
    const grossAnnualValuePctRevenue = annual_company_revenue > 0 ? (integratedGrossSavings / annual_company_revenue) * 100 : 0;

    // Aliases for external v3 metrics schema naming
    const totalCurrentLogisticsSpend = totalCurrentCost;
    const totalProjectedLogisticsSpend = totalTargetCost;
    const grossLogisticsSavings = grossSavings;
    const truckloadsEliminated = loadsEliminated;
    const freightMilesEliminated = milesEliminated;

    const commercialProgramGrossValue = totalCommercialProgramValue;
    const newDealersRecruited = annual_qualified_opportunities;
    const avgInitialOrderVolume = avg_deal_size;
    const partsAndServicesUpliftValue = crossSellValue;

    const newDealerRecruitmentValueAlias = newDealerRecruitmentValue;
    const dealerOnboardingRateImpact = salesWinLiftValue;
    const serviceAndWarrantyEfficiencyValue = serviceEfficiencyValue;
    const dealerRetentionValue = retentionValue;

    const totalGrossValue = integratedGrossSavings;
    const totalNetValue = integratedNetSavings;
    const totalNetAnnualValue = totalNetValue;
    const totalROI5year = integratedROI5year;
    const projectedRevenueGrowthPct = projectedRevenueLiftPct;

    const riskAdjustedNetValue = sensitivityNet;
    const riskAdjustedPaybackMonths = sensitivityPayback;
    const riskAdjustedROI5year = sensitivityROI;

    // v4.1 naming aliases
    const currentAnnualFreightSpend = totalCurrentCost;
    const projectedAnnualFreightSpend = totalTargetCost;
    const annualFreightSavings = grossSavings;
    const avgCapacityUtilizationPct = {
        current: utilization_current_pct * 100,
        projected: utilization_target_pct * 100
    };

    const shareOfWalletGrowthValue = dealerWalletShareGrowthValue;
    const dealerChurnReductionValueAlias = retentionValue;

    const currentPartsAndServiceRevenue = cross_sell_annual_revenue;
    const projectedPartsAndServiceRevenue = crossSellRevenueTarget;
    const warrantyCostReductionAlias = serviceEfficiencyValue;
    const serviceTechnicianUtilizationPct = {
        current: service_technician_utilization_current_pct * 100,
        projected: clamp(service_technician_utilization_current_pct * (1 + service_technician_utilization_lift_pct), 0, 0.99) * 100
    };

    // Step 8: 5-Year Projection
    const yearlyData = [];
    let cumulative = 0;
    for (let y = 1; y <= 5; y++) {
        const yearCost = totalTargetCost + annual_platform_cost + (y === 1 ? implementation_cost : 0);
        const yearSavings = totalCurrentCost - yearCost;
        cumulative += yearSavings;
        yearlyData.push({
            year: 'Year ' + y,
            currentCost: totalCurrentCost,
            transformedCost: yearCost,
            netSavings: yearSavings,
            cumulative: cumulative
        });
    }

    const fiveYearCashFlow = [];
    let cumulativeDiscounted = 0;
    for (let y = 1; y <= 5; y++) {
        const implementationOutlay = y === 1 ? implementation_cost : 0;
        const grossValue = grossSavings + totalCommercialProgramValue + warrantyCostReduction + totalRoleProductivityValue;
        const netCashFlow = grossValue - annual_platform_cost - implementationOutlay;
        const discountFactor = Math.pow(1 + discount_rate_wacc_pct, y);
        const discountedNetCashFlow = netCashFlow / discountFactor;
        cumulativeDiscounted += discountedNetCashFlow;
        fiveYearCashFlow.push({
            year: `Year ${y}`,
            grossLogisticsSavings: grossSavings,
            commercialProgramValue: totalCommercialProgramValue,
            annualPlatformCost: annual_platform_cost,
            implementationCost: implementationOutlay,
            netCashFlow,
            discountRate: discount_rate_wacc_pct,
            discountedNetCashFlow,
            cumulativeDiscountedNetCashFlow: cumulativeDiscounted
        });
    }
    const netPresentValue5year = fiveYearCashFlow.reduce((acc, y) => acc + y.discountedNetCashFlow, 0);

    const metricCategoriesV41 = {
        executive_summary_kpis: {
            totalNetAnnualValue,
            paybackMonths,
            totalROI5year,
            netPresentValue5year
        },
        logistics_and_fulfillment_kpis: {
            currentAnnualFreightSpend,
            projectedAnnualFreightSpend,
            annualFreightSavings,
            truckloadsEliminated,
            avgCapacityUtilizationPct
        },
        commercial_and_channel_kpis: {
            totalCommercialProgramValue,
            newDealerRecruitmentValue,
            shareOfWalletGrowthValue,
            dealerChurnReductionValue: dealerChurnReductionValueAlias
        },
        parts_and_service_kpis: {
            currentPartsAndServiceRevenue,
            projectedPartsAndServiceRevenue,
            warrantyCostReduction: warrantyCostReductionAlias,
            serviceTechnicianUtilizationPct
        },
        financial_summary_and_projections: {
            fiveYearCashFlow,
            riskAdjustedNetValue
        }
    };

    return {
        // Volume
        totalAnnualTrailers, annualSoldTrailers,
        // Current
        currentLoads, currentFreightCost, currentChangeOrderCost, totalCurrentCost,
        // Target
        targetLoads, costAfterCapacity, costAfterRouting, targetChangeOrderCost, totalTargetCost,
        // Savings
        grossSavings, netSavings, paybackMonths, roi5year, totalInvestment5yr,
        // CRM/CX
        marketingPipelineValue, salesWinLiftValue, crossSellValue, serviceEfficiencyValue, retentionValue, crmGrossValue,
        customerSalesProductivityValue, operationsProductivityValue, supportProductivityValue, totalRoleProductivityValue,
        avgDealSizeTarget, grossMarginTarget: 0, avgGrossProfitCurrent: 0, avgGrossProfitTarget: 0, winRateTarget: 0, crossSellRevenueTarget,
        // Integrated
        integratedGrossSavings, integratedNetSavings, integratedROI5year,
        annual_company_revenue, netAnnualValuePctRevenue, grossAnnualValuePctRevenue,
        projected_annual_revenue, projectedRevenueLiftPct,
        // Schema aliases
        totalCurrentLogisticsSpend, totalProjectedLogisticsSpend, grossLogisticsSavings,
        truckloadsEliminated, freightMilesEliminated,
        commercialProgramGrossValue, newDealersRecruited, avgInitialOrderVolume, partsAndServicesUpliftValue,
        newDealerRecruitmentValue: newDealerRecruitmentValueAlias, dealerOnboardingRateImpact, serviceAndWarrantyEfficiencyValue, dealerRetentionValue,
        totalGrossValue, totalNetValue, totalROI5year, projectedRevenueGrowthPct,
        totalNetAnnualValue,
        currentAnnualFreightSpend, projectedAnnualFreightSpend, annualFreightSavings, avgCapacityUtilizationPct,
        totalCommercialProgramValue, shareOfWalletGrowthValue, dealerChurnReductionValue: dealerChurnReductionValueAlias,
        currentPartsAndServiceRevenue, projectedPartsAndServiceRevenue, warrantyCostReduction: warrantyCostReductionAlias, serviceTechnicianUtilizationPct,
        fiveYearCashFlow, netPresentValue5year, discountRateWaccPct: discount_rate_wacc_pct * 100,
        riskAdjustedNetValue, riskAdjustedPaybackMonths, riskAdjustedROI5year,
        metricCategoriesV41,
        sell_through_pct, realized_revenue_per_trailer,
        // Waterfall
        capacitySavings, routingSavings, changeOrderSavings,
        // Operational
        loadsEliminated, changeOrdersAvoided, milesEliminated,
        // Sensitivity
        sensitivityPayback, sensitivityROI, sensitivityNet,
        // Yearly
        yearlyData,
        // Pass-through
        implementation_cost, annual_platform_cost
    };
}

// ---- Scenario Comparison ----
function calculateAllScenarios() {
    const baseInputs = {
        sell_through_pct: val('sell_through_pct'),
        realized_revenue_per_trailer: val('realized_revenue_per_trailer'),
        num_plants: val('num_plants'),
        trailers_per_plant_day: val('trailers_per_plant_day'),
        working_days_year: val('working_days_year'),
        trailers_per_truck_capacity: val('trailers_per_truck_capacity'),
        avg_haul_miles: val('avg_haul_miles'),
        freight_rate_per_mile: val('freight_rate_per_mile'),
        change_order_premium_pct: val('change_order_premium_pct')
    };
    const results = {};
    for (const [key, preset] of Object.entries(scenarioPresets)) {
        results[key] = calculateROI({ ...baseInputs, ...preset.params });
    }
    return results;
}

// ---- Dynamic Slider Constraints ----
function enforceConstraints() {
    const utilCurrent = val('utilization_current_pct');
    const utilTarget = $('utilization_target_pct');
    utilTarget.min = utilCurrent;
    if (parseFloat(utilTarget.value) < utilCurrent) utilTarget.value = utilCurrent;

    const utilChange = $('util_improvement_pct');
    const maxUtilChange = utilCurrent > 0 ? ((100 / utilCurrent) - 1) * 100 : 0;
    utilChange.max = Math.max(0, maxUtilChange);
    if (parseFloat(utilChange.value) > maxUtilChange) utilChange.value = maxUtilChange;

    const coCurrent = val('change_order_current_pct');
    const coTarget = $('change_order_target_pct');
    coTarget.max = coCurrent;
    if (parseFloat(coTarget.value) > coCurrent) coTarget.value = coCurrent;

    const coReduction = $('co_reduction_pct');
    coReduction.min = 0;
    coReduction.max = 100;
}

function setKPIView(view) {
    const allowed = ['board', 'ops', 'commercial', 'service'];
    currentKPIView = allowed.includes(view) ? view : 'board';

    const boardBtn = $('kpiViewBoard');
    const opsBtn = $('kpiViewOps');
    const commercialBtn = $('kpiViewCommercial');
    const serviceBtn = $('kpiViewService');
    if (boardBtn) boardBtn.classList.toggle('active', currentKPIView === 'board');
    if (opsBtn) opsBtn.classList.toggle('active', currentKPIView === 'ops');
    if (commercialBtn) commercialBtn.classList.toggle('active', currentKPIView === 'commercial');
    if (serviceBtn) serviceBtn.classList.toggle('active', currentKPIView === 'service');

    // Re-render with current numbers immediately when toggled.
    updateCalculations();
}

// ---- Update Everything ----
function updateCalculations() {
    enforceConstraints();
    syncTargetsFromChangeSliders();

    // Store previous for deltas
    const prev = previousResults;
    const r = calculateROI();

    // Update slider value displays
    updateSliderDisplays();

    // Hero metrics (toggle between executive, logistics, commercial, service emphasis)
    if (currentKPIView === 'ops') {
        if ($('labelMetric1')) $('labelMetric1').textContent = 'Current Logistics Spend (Annual)';
        if ($('labelMetric2')) $('labelMetric2').textContent = 'Projected Logistics Spend (Annual)';
        if ($('labelMetric3')) $('labelMetric3').textContent = 'Gross Logistics Savings (Annual)';
        if ($('labelMetric4')) $('labelMetric4').textContent = 'Truckloads Eliminated / Year';

        updateMetric('metricNetValue', fmtK(r.totalCurrentCost), prev ? r.totalCurrentCost - prev.totalCurrentCost : 0);
        updateMetric('metricPayback', fmtK(r.totalTargetCost), prev ? r.totalTargetCost - prev.totalTargetCost : 0);
        updateMetric('metricROI', fmtK(r.grossSavings), prev ? r.grossSavings - prev.grossSavings : 0);
        updateMetric('metricRevenueLift', fmtNum(r.loadsEliminated), prev ? r.loadsEliminated - prev.loadsEliminated : 0);

        if ($('riskAdjustedSummary')) $('riskAdjustedSummary').style.display = 'none';
        if ($('costMechanicsRow')) $('costMechanicsRow').style.display = 'none';
    } else if (currentKPIView === 'commercial') {
        if ($('labelMetric1')) $('labelMetric1').textContent = 'Total Commercial Program Value';
        if ($('labelMetric2')) $('labelMetric2').textContent = 'New Dealer Recruitment Value';
        if ($('labelMetric3')) $('labelMetric3').textContent = 'Dealer Wallet Share Growth';
        if ($('labelMetric4')) $('labelMetric4').textContent = 'Dealer Churn Reduction Value';

        updateMetric('metricNetValue', fmtK(r.totalCommercialProgramValue), prev ? r.totalCommercialProgramValue - prev.totalCommercialProgramValue : 0);
        updateMetric('metricPayback', fmtK(r.newDealerRecruitmentValue), prev ? r.newDealerRecruitmentValue - prev.newDealerRecruitmentValue : 0);
        updateMetric('metricROI', fmtK(r.shareOfWalletGrowthValue), prev ? r.shareOfWalletGrowthValue - prev.shareOfWalletGrowthValue : 0);
        updateMetric('metricRevenueLift', fmtK(r.dealerChurnReductionValue), prev ? r.dealerChurnReductionValue - prev.dealerChurnReductionValue : 0);

        if ($('riskAdjustedSummary')) $('riskAdjustedSummary').style.display = 'none';
        if ($('costMechanicsRow')) $('costMechanicsRow').style.display = 'none';
    } else if (currentKPIView === 'service') {
        if ($('labelMetric1')) $('labelMetric1').textContent = 'Current Parts & Service Revenue';
        if ($('labelMetric2')) $('labelMetric2').textContent = 'Projected Parts & Service Revenue';
        if ($('labelMetric3')) $('labelMetric3').textContent = 'Warranty Cost Reduction';
        if ($('labelMetric4')) $('labelMetric4').textContent = 'Service Tech Utilization (Projected)';

        updateMetric('metricNetValue', fmtK(r.currentPartsAndServiceRevenue), prev ? r.currentPartsAndServiceRevenue - prev.currentPartsAndServiceRevenue : 0);
        updateMetric('metricPayback', fmtK(r.projectedPartsAndServiceRevenue), prev ? r.projectedPartsAndServiceRevenue - prev.projectedPartsAndServiceRevenue : 0);
        updateMetric('metricROI', fmtK(r.warrantyCostReduction), prev ? r.warrantyCostReduction - prev.warrantyCostReduction : 0);
        updateMetric('metricRevenueLift', fmtPct(r.serviceTechnicianUtilizationPct.projected), prev ? r.serviceTechnicianUtilizationPct.projected - prev.serviceTechnicianUtilizationPct.projected : 0, true);

        if ($('riskAdjustedSummary')) $('riskAdjustedSummary').style.display = 'none';
        if ($('costMechanicsRow')) $('costMechanicsRow').style.display = 'none';
    } else {
        if ($('labelMetric1')) $('labelMetric1').textContent = 'Net Annual Value';
        if ($('labelMetric2')) $('labelMetric2').textContent = 'Payback Period';
        if ($('labelMetric3')) $('labelMetric3').textContent = '5-Year ROI';
        if ($('labelMetric4')) $('labelMetric4').textContent = '5-Year NPV';

        updateMetric('metricNetValue', fmtK(r.integratedNetSavings), prev ? r.integratedNetSavings - prev.integratedNetSavings : 0);
        updateMetric('metricROI', fmtPct(r.integratedROI5year), prev ? r.integratedROI5year - prev.integratedROI5year : 0, true);
        updateMetric('metricRevenueLift', fmtK(r.netPresentValue5year), prev ? r.netPresentValue5year - prev.netPresentValue5year : 0);

        const paybackContainer = $('metricPayback');
        if (paybackContainer) {
            paybackContainer.querySelector('.metric-value').textContent = r.paybackMonths !== Infinity ? `${r.paybackMonths.toFixed(1)} mo` : 'N/A';
            const deltaEl = paybackContainer.querySelector('.metric-delta');
            const paybackDelta = prev ? r.paybackMonths - prev.paybackMonths : 0;
            if (Number.isFinite(paybackDelta) && Math.abs(paybackDelta) > 0.2) {
                const sign = paybackDelta > 0 ? '+' : '';
                deltaEl.textContent = `${sign}${paybackDelta.toFixed(1)} mo`;
                deltaEl.className = 'metric-delta visible ' + (paybackDelta < 0 ? 'text-green' : 'text-red');
                setTimeout(() => deltaEl.classList.remove('visible'), 2000);
            }
        }

        if ($('riskAdjustedSummary')) $('riskAdjustedSummary').style.display = 'block';
        if ($('costMechanicsRow')) $('costMechanicsRow').style.display = 'grid';
    }

    // Secondary cost mechanics row
    if ($('secCurrentCost')) $('secCurrentCost').textContent = fmtK(r.totalCurrentCost);
    if ($('secTargetCost')) $('secTargetCost').textContent = fmtK(r.totalTargetCost);
    if ($('secGrossSavings')) $('secGrossSavings').textContent = fmtK(r.grossSavings);
    if ($('secPlatformCost')) $('secPlatformCost').textContent = fmtK(r.annual_platform_cost);

    if ($('crmValueGross')) $('crmValueGross').textContent = fmtK(r.crmGrossValue);
    if ($('integratedGross')) $('integratedGross').textContent = fmtK(r.integratedGrossSavings);
    if ($('integratedROI')) $('integratedROI').textContent = fmtPct(r.integratedROI5year);
    if ($('annual_company_revenue_display')) $('annual_company_revenue_display').textContent = fmt(r.annual_company_revenue);
    if ($('projected_annual_revenue_display')) $('projected_annual_revenue_display').textContent = fmt(r.projected_annual_revenue);
    if ($('role_productivity_value_display')) $('role_productivity_value_display').textContent = fmt(r.totalRoleProductivityValue);
    if ($('projectedRevenueLiftText')) $('projectedRevenueLiftText').textContent = `Revenue growth vs baseline: ${formatSignedPercent(r.projectedRevenueLiftPct)}`;
    if ($('annualRevenueFormula')) {
        $('annualRevenueFormula').textContent = `Formula: ${fmtNum(r.totalAnnualTrailers)} produced × ${fmtPct(r.sell_through_pct * 100)} sell-through × ${fmt(r.realized_revenue_per_trailer)}/trailer`;
    }
    if ($('realityCheckText')) {
        $('realityCheckText').innerHTML = `Integrated net annual value is <strong>${fmtPct(r.netAnnualValuePctRevenue)}</strong> of annual revenue (${fmt(r.integratedNetSavings)} of ${fmt(r.annual_company_revenue)}).`;
    }
    if ($('riskAdjustedSummary') && currentKPIView === 'board') {
        if (r.sensitivityPayback !== Infinity && r.sensitivityNet > 0) {
            $('riskAdjustedSummary').innerHTML = `Risk-adjusted case (<strong>50% achievement</strong>): Net annual value = <strong>${fmtK(r.sensitivityNet)}</strong>, Payback = <strong>${r.sensitivityPayback.toFixed(1)} months</strong>, 5-Year ROI = <strong>${fmtPct(r.sensitivityROI)}</strong>.`;
        } else {
            $('riskAdjustedSummary').innerHTML = `Risk-adjusted case (<strong>50% achievement</strong>): Net annual value would be negative under current assumptions.`;
        }
    }

    // Operational metrics
    $('opsLoads').textContent = fmtNum(r.loadsEliminated);
    $('opsChangeOrders').textContent = fmtNum(r.changeOrdersAvoided);
    $('opsMiles').textContent = fmtNum(r.milesEliminated);

    // Sensitivity
    if (r.sensitivityPayback !== Infinity && r.sensitivityNet > 0) {
        $('sensitivityText').innerHTML = `If you achieve only <strong>50%</strong> of projected savings: Payback = <strong>${r.sensitivityPayback.toFixed(1)} months</strong>, 5-Year ROI = <strong>${fmtPct(r.sensitivityROI)}</strong>`;
    } else {
        $('sensitivityText').innerHTML = `At <strong>50%</strong> achievement, net savings would be negative. Consider reducing platform costs.`;
    }

    // Actionable warning only
    toggleWarning('warningNegative', r.integratedNetSavings <= 0);

    // Breakdown
    updateBreakdown(r);

    // Scenario comparison table
    updateComparisonTable();

    // Year-by-year table
    updateYearTable(r);

    // Charts
    updateCharts(r);

    previousResults = r;
}

function updateMetric(containerId, valueText, delta, isPct) {
    const container = $(containerId);
    container.querySelector('.metric-value').textContent = valueText;
    const deltaEl = container.querySelector('.metric-delta');
    if (delta && Math.abs(delta) > (isPct ? 0.5 : 100)) {
        const sign = delta > 0 ? '+' : '';
        deltaEl.textContent = isPct ? `${sign}${delta.toFixed(1)}pp` : `${sign}${fmtK(delta)}`;
        deltaEl.className = 'metric-delta visible ' + (delta > 0 ? 'text-green' : 'text-red');
        setTimeout(() => deltaEl.classList.remove('visible'), 2000);
    }
}

function updateSliderDisplays() {
    $('valUtilCurrent').textContent = val('utilization_current_pct') + '%';
    $('valUtilChange').textContent = formatSignedPercent(val('util_improvement_pct'));
    $('valUtilTarget').textContent = val('utilization_target_pct') + '%';
    if ($('valRoutingCurrent')) $('valRoutingCurrent').textContent = `${val('routing_empty_miles_current_pct')}%`;
    if ($('valRoutingChange')) $('valRoutingChange').textContent = formatSignedPercent(val('routing_empty_miles_reduction_pct'));
    if ($('valRoutingTarget')) $('valRoutingTarget').textContent = `${Math.round((val('routing_empty_miles_current_pct') * (1 - val('routing_empty_miles_reduction_pct') / 100)) * 10) / 10}%`;
    $('valCOCurrent').textContent = val('change_order_current_pct') + '%';
    $('valCOReduction').textContent = formatSignedPercent(-val('co_reduction_pct'));
    $('valCOTarget').textContent = val('change_order_target_pct') + '%';

    if ($('valMarketingLift')) $('valMarketingLift').textContent = formatSignedPercent(val('marketing_pipeline_lift_pct'));
    if ($('valDealSizeCurrent')) $('valDealSizeCurrent').textContent = fmt(val('avg_deal_size'));
    if ($('valDealSizeChange')) $('valDealSizeChange').textContent = formatSignedPercent(val('deal_size_change_pct'));
    if ($('valDealSizeTarget')) $('valDealSizeTarget').textContent = fmt(val('avg_deal_size') * (1 + val('deal_size_change_pct') / 100));
    if ($('valShareWalletGrowth')) $('valShareWalletGrowth').textContent = formatSignedPercent(val('deal_size_change_pct'));
    if ($('valMarginCurrent')) $('valMarginCurrent').textContent = `${val('gross_margin_current_pct')}%`;
    if ($('valMarginChange')) $('valMarginChange').textContent = formatSignedPercent(val('gross_margin_change_pct'));
    if ($('valMarginTarget')) $('valMarginTarget').textContent = `${Math.round((val('gross_margin_current_pct') * (1 + val('gross_margin_change_pct') / 100)) * 10) / 10}%`;
    if ($('valProfitPerWinCurrent')) $('valProfitPerWinCurrent').textContent = fmt(val('avg_deal_size') * (val('gross_margin_current_pct') / 100));
    if ($('valProfitPerWinTarget')) $('valProfitPerWinTarget').textContent = fmt((val('avg_deal_size') * (1 + val('deal_size_change_pct') / 100)) * ((val('gross_margin_current_pct') * (1 + val('gross_margin_change_pct') / 100)) / 100));

    if ($('valWinRateCurrent')) $('valWinRateCurrent').textContent = `${val('win_rate_current_pct')}%`;
    if ($('valWinRateChange')) $('valWinRateChange').textContent = formatSignedPercent(val('win_rate_lift_pct'));
    if ($('valWinRateTarget')) $('valWinRateTarget').textContent = `${Math.round(val('win_rate_current_pct') * (1 + val('win_rate_lift_pct') / 100) * 10) / 10}%`;

    if ($('valCrossSellCurrent')) $('valCrossSellCurrent').textContent = fmtM(val('cross_sell_annual_revenue'));
    if ($('valCrossSellChange')) $('valCrossSellChange').textContent = formatSignedPercent(val('cross_sell_lift_pct'));
    if ($('valCrossSellTarget')) $('valCrossSellTarget').textContent = fmtM(val('cross_sell_annual_revenue') * (1 + val('cross_sell_lift_pct') / 100));

    if ($('valServiceLift')) $('valServiceLift').textContent = formatSignedPercent(val('case_resolution_reduction_pct'));
    if ($('valRetentionLift')) $('valRetentionLift').textContent = formatSignedPercent(val('retention_lift_pct'));
    if ($('valChurnCurrent')) $('valChurnCurrent').textContent = `${valOr('dealer_churn_current_pct', 12)}%`;
    if ($('valChurnReduction')) $('valChurnReduction').textContent = formatSignedPercent(valOr('dealer_churn_reduction_pct', 15));
    if ($('valChurnTarget')) $('valChurnTarget').textContent = `${Math.round((valOr('dealer_churn_current_pct', 12) * (1 - valOr('dealer_churn_reduction_pct', 15) / 100)) * 10) / 10}%`;
    if ($('valWarrantyReduction')) $('valWarrantyReduction').textContent = formatSignedPercent(valOr('warranty_claim_processing_reduction_pct', 25));
    if ($('valSvcTechUtilCurrent')) $('valSvcTechUtilCurrent').textContent = `${valOr('service_technician_utilization_current_pct', 70)}%`;
    if ($('valSvcTechUtilLift')) $('valSvcTechUtilLift').textContent = formatSignedPercent(valOr('service_technician_utilization_lift_pct', 10));
    if ($('valSvcTechUtilTarget')) $('valSvcTechUtilTarget').textContent = `${Math.round((valOr('service_technician_utilization_current_pct', 70) * (1 + valOr('service_technician_utilization_lift_pct', 10) / 100)) * 10) / 10}%`;

    if ($('valProdCustomerSales')) $('valProdCustomerSales').textContent = fmt(valOr('prod_customer_sales_cost', 2350000) * (valOr('prod_customer_sales_eff_pct', 25) / 100) * (valOr('prod_customer_sales_realization_pct', 80) / 100));
    if ($('valProdCustomerSalesEff')) $('valProdCustomerSalesEff').textContent = `${valOr('prod_customer_sales_eff_pct', 25)}%`;
    if ($('valProdCustomerSalesRealization')) $('valProdCustomerSalesRealization').textContent = `${valOr('prod_customer_sales_realization_pct', 80)}%`;
    if ($('valProdOperations')) $('valProdOperations').textContent = fmt(valOr('prod_operations_cost', 1050000) * (valOr('prod_operations_eff_pct', 32) / 100) * (valOr('prod_operations_realization_pct', 80) / 100));
    if ($('valProdOperationsEff')) $('valProdOperationsEff').textContent = `${valOr('prod_operations_eff_pct', 32)}%`;
    if ($('valProdOperationsRealization')) $('valProdOperationsRealization').textContent = `${valOr('prod_operations_realization_pct', 80)}%`;
    if ($('valProdSupport')) $('valProdSupport').textContent = fmt(valOr('prod_support_cost', 560000) * (valOr('prod_support_eff_pct', 40) / 100) * (valOr('prod_support_realization_pct', 80) / 100));
    if ($('valProdSupportEff')) $('valProdSupportEff').textContent = `${valOr('prod_support_eff_pct', 40)}%`;
    if ($('valProdSupportRealization')) $('valProdSupportRealization').textContent = `${valOr('prod_support_realization_pct', 80)}%`;
    if ($('valProdTotal')) {
        const totalProd =
            valOr('prod_customer_sales_cost', 2350000) * (valOr('prod_customer_sales_eff_pct', 25) / 100) * (valOr('prod_customer_sales_realization_pct', 80) / 100) +
            valOr('prod_operations_cost', 1050000) * (valOr('prod_operations_eff_pct', 32) / 100) * (valOr('prod_operations_realization_pct', 80) / 100) +
            valOr('prod_support_cost', 560000) * (valOr('prod_support_eff_pct', 40) / 100) * (valOr('prod_support_realization_pct', 80) / 100);
        $('valProdTotal').textContent = fmt(totalProd);
    }

    if ($('valImplementationCost')) $('valImplementationCost').textContent = fmt(val('implementation_cost'));
    if ($('valAnnualPlatformCost')) $('valAnnualPlatformCost').textContent = fmt(val('annual_platform_cost'));
    if ($('valWacc')) $('valWacc').textContent = `${valOr('discount_rate_wacc_pct', 10)}%`;

    formatCurrencyInputs();

    updateLeverComparison();
}

function formatSignedPercent(n) {
    const rounded = Math.round(n);
    if (rounded > 0) return `+${rounded}%`;
    if (rounded < 0) return `${rounded}%`;
    return '0%';
}

function updateLeverComparison() {
    const utilCurrent = val('utilization_current_pct');
    const utilTarget = val('utilization_target_pct');
    const routingCurrent = val('routing_empty_miles_current_pct');
    const routingReduction = val('routing_empty_miles_reduction_pct');
    const routingTarget = routingCurrent * (1 - routingReduction / 100);
    const coCurrent = val('change_order_current_pct');
    const coTarget = val('change_order_target_pct');

    const utilChange = utilCurrent > 0 ? ((utilTarget - utilCurrent) / utilCurrent) * 100 : 0;
    const coChange = coCurrent > 0 ? ((coTarget - coCurrent) / coCurrent) * 100 : 0;

    if ($('cmpUtilCurrent')) $('cmpUtilCurrent').textContent = `${Math.round(utilCurrent)}%`;
    if ($('cmpUtilChange')) $('cmpUtilChange').textContent = formatSignedPercent(utilChange);
    if ($('cmpUtilTarget')) $('cmpUtilTarget').textContent = `${Math.round(utilTarget)}%`;

    if ($('cmpRoutingCurrent')) $('cmpRoutingCurrent').textContent = `${Math.round(routingCurrent * 10) / 10}%`;
    if ($('cmpRoutingChange')) $('cmpRoutingChange').textContent = formatSignedPercent(routingReduction);
    if ($('cmpRoutingTarget')) $('cmpRoutingTarget').textContent = `${Math.round(routingTarget * 10) / 10}%`;

    if ($('cmpCOCurrent')) $('cmpCOCurrent').textContent = `${Math.round(coCurrent)}%`;
    if ($('cmpCOChange')) $('cmpCOChange').textContent = formatSignedPercent(coChange);
    if ($('cmpCOTarget')) $('cmpCOTarget').textContent = `${Math.round(coTarget)}%`;
}

function formatCurrencyInputs() {
    [
        'realized_revenue_per_trailer',
        'avg_deal_size',
        'cross_sell_annual_revenue',
        'prod_customer_sales_cost',
        'prod_operations_cost',
        'prod_support_cost',
        'implementation_cost',
        'annual_platform_cost'
    ].forEach(id => {
        const input = $(id);
        if (!input) return;
        if (document.activeElement === input) return;
        const n = Math.round(val(id));
        input.value = `$${n.toLocaleString()}`;
    });
}

function toggleWarning(id, show) {
    const el = $(id);
    if (el) el.className = 'alert ' + (id === 'warningNegative' ? 'alert-danger' : 'alert-warning') + (show ? ' visible' : '');
}

function updateBreakdown(r) {
    $('bkCurrentFreight').textContent = fmtK(r.currentFreightCost);
    $('bkCurrentCO').textContent = fmtK(r.currentChangeOrderCost);
    $('bkTotalCurrent').textContent = fmtK(r.totalCurrentCost);
    $('bkCapacitySavings').textContent = '−' + fmtK(r.capacitySavings);
    $('bkRoutingSavings').textContent = '−' + fmtK(r.routingSavings);
    $('bkCOSavings').textContent = '−' + fmtK(r.changeOrderSavings);
    $('bkTotalTarget').textContent = fmtK(r.totalTargetCost);
    $('bkGrossSavings').textContent = fmtK(r.grossSavings);
    $('bkPlatformCost').textContent = '−' + fmtK(r.annual_platform_cost);
    $('bkNetSavings').textContent = fmtK(r.netSavings);
    $('bkPayback').textContent = r.paybackMonths !== Infinity ? r.paybackMonths.toFixed(1) + ' months' : 'N/A';
    $('bkROI5').textContent = fmtPct(r.roi5year);

    // Formulas
    $('fmCurrentLoads').textContent = `${fmtNum(r.totalAnnualTrailers)} trailers ÷ (${val('trailers_per_truck_capacity')} × ${val('utilization_current_pct')}%) = ${fmtNum(r.currentLoads)} loads`;
    $('fmTargetLoads').textContent = `${fmtNum(r.totalAnnualTrailers)} trailers ÷ (${val('trailers_per_truck_capacity')} × ${val('utilization_target_pct')}%) = ${fmtNum(r.targetLoads)} loads`;
}

function updateComparisonTable() {
    const all = calculateAllScenarios();
    for (const [key, r] of Object.entries(all)) {
        $(`cmp_${key}_current`).textContent = fmtK(r.totalCurrentCost);
        $(`cmp_${key}_target`).textContent = fmtK(r.totalTargetCost);
        $(`cmp_${key}_savings`).textContent = fmtK(r.grossSavings);
        $(`cmp_${key}_payback`).textContent = r.paybackMonths !== Infinity ? r.paybackMonths.toFixed(1) + ' mo' : 'N/A';
        $(`cmp_${key}_roi`).textContent = fmtPct(r.roi5year);
    }
}

function updateYearTable(r) {
    const tbody = $('yearTableBody');
    tbody.innerHTML = '';
    for (const y of r.yearlyData) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${y.year}</td>
            <td>${fmtK(y.currentCost)}</td>
            <td>${fmtK(y.transformedCost)}</td>
            <td class="text-green">${fmtK(y.netSavings)}</td>
            <td class="text-green" style="font-weight:600">${fmtK(y.cumulative)}</td>
        `;
        tbody.appendChild(tr);
    }
}

// ---- Charts ----
function initCharts() {
    const r = calculateROI();

    // Waterfall
    const wCtx = $('waterfallChart').getContext('2d');
    waterfallChart = new Chart(wCtx, {
        type: 'bar',
        data: {
            labels: ['Current Cost', 'Capacity\nSavings', 'Routing\nSavings', 'Change Order\nSavings', 'Target Cost'],
            datasets: [{
                data: [r.totalCurrentCost, -r.capacitySavings, -r.routingSavings, -r.changeOrderSavings, r.totalTargetCost],
                backgroundColor: ['#38003C', '#10b981', '#10b981', '#10b981', '#7A39ED']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false },
                tooltip: { callbacks: { label: ctx => fmtK(Math.abs(ctx.raw)) } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => fmtK(v) } }
            }
        }
    });

    // 5-Year Projection
    const pCtx = $('projectionChart').getContext('2d');
    projectionChart = new Chart(pCtx, {
        type: 'bar',
        data: {
            labels: r.yearlyData.map(y => y.year),
            datasets: [
                { label: 'Current Cost', data: r.yearlyData.map(y => y.currentCost), backgroundColor: '#38003C' },
                { label: 'Transformed Cost', data: r.yearlyData.map(y => y.transformedCost), backgroundColor: '#7A39ED' },
                { label: 'Cumulative Savings', data: r.yearlyData.map(y => y.cumulative), type: 'line', borderColor: '#16815A', backgroundColor: 'rgba(22,129,90,0.1)', fill: true, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => fmtK(v) } },
                y1: { position: 'right', beginAtZero: true, ticks: { callback: v => fmtK(v) }, grid: { drawOnChartArea: false } }
            }
        }
    });
}

function updateCharts(r) {
    if (!waterfallChart || !projectionChart) return;

    waterfallChart.data.datasets[0].data = [
        r.totalCurrentCost, -r.capacitySavings, -r.routingSavings, -r.changeOrderSavings, r.totalTargetCost
    ];
    waterfallChart.update('none');

    projectionChart.data.datasets[0].data = r.yearlyData.map(y => y.currentCost);
    projectionChart.data.datasets[1].data = r.yearlyData.map(y => y.transformedCost);
    projectionChart.data.datasets[2].data = r.yearlyData.map(y => y.cumulative);
    projectionChart.update('none');
}

// ---- Scenario Management ----
function setScenario(scenario) {
    currentScenario = scenario;
    document.querySelectorAll('.scenario-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    const preset = scenarioPresets[scenario];
    $('scenarioDesc').textContent = preset.description;

    // Apply slider values
    for (const [key, value] of Object.entries(preset.params)) {
        const el = $(key);
        if (el) el.value = value;
    }

    // Scenario lift presets tied to active business levers
    const stageLiftPresets = {
        conservative: {
            marketing_pipeline_lift_pct: 2,
            deal_size_change_pct: 3,
            cross_sell_lift_pct: 3,
            dealer_churn_reduction_pct: 10,
            warranty_claim_processing_reduction_pct: 15,
            service_technician_utilization_lift_pct: 6
        },
        realistic: {
            marketing_pipeline_lift_pct: 5,
            deal_size_change_pct: 5,
            cross_sell_lift_pct: 6,
            dealer_churn_reduction_pct: 15,
            warranty_claim_processing_reduction_pct: 25,
            service_technician_utilization_lift_pct: 10
        },
        optimistic: {
            marketing_pipeline_lift_pct: 10,
            deal_size_change_pct: 12,
            cross_sell_lift_pct: 10,
            dealer_churn_reduction_pct: 25,
            warranty_claim_processing_reduction_pct: 40,
            service_technician_utilization_lift_pct: 15
        }
    };
    const stagePreset = stageLiftPresets[scenario] || stageLiftPresets.realistic;
    Object.entries(stagePreset).forEach(([key, value]) => {
        const el = $(key);
        if (el) el.value = value;
    });

    // Keep change-% sliders aligned with scenario target values.
    syncChangeSlidersFromTargets();

    updateCalculations();
}

// ---- Stepper Buttons ----
function step(id, amount) {
    const input = $(id);
    const minParsed = parseFloat(input.min);
    const maxParsed = parseFloat(input.max);
    const min = Number.isFinite(minParsed) ? minParsed : -Infinity;
    const max = Number.isFinite(maxParsed) ? maxParsed : Infinity;
    const stepAttr = parseFloat(input.step) || 1;
    let newVal = parseNumeric(input.value) + amount;
    newVal = Math.max(min, Math.min(max, newVal));
    newVal = Math.round(newVal * 100) / 100;
    input.value = newVal;
    updateCalculations();
}

// ---- Collapsible Cards ----
function toggleCard(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');
    content.classList.toggle('collapsed');
    icon.classList.toggle('collapsed');
}

// ---- Save / Load ----
function getAllInputValues() {
    const ids = [
        'sell_through_pct', 'realized_revenue_per_trailer',
        'num_plants', 'trailers_per_plant_day', 'working_days_year', 'trailers_per_truck_capacity',
        'avg_haul_miles', 'freight_rate_per_mile', 'change_order_premium_pct',
        'utilization_current_pct', 'utilization_target_pct', 'routing_empty_miles_current_pct', 'routing_empty_miles_reduction_pct',
        'change_order_current_pct', 'change_order_target_pct',
        'implementation_cost', 'annual_platform_cost',
        'annual_qualified_opportunities', 'marketing_pipeline_lift_pct', 'avg_deal_size', 'deal_size_change_pct',
        'cross_sell_annual_revenue', 'cross_sell_lift_pct',
        'prod_customer_sales_cost', 'prod_customer_sales_eff_pct', 'prod_customer_sales_realization_pct',
        'prod_operations_cost', 'prod_operations_eff_pct', 'prod_operations_realization_pct',
        'prod_support_cost', 'prod_support_eff_pct', 'prod_support_realization_pct',
        'dealer_churn_current_pct', 'dealer_churn_reduction_pct',
        'warranty_claim_processing_cost_current', 'warranty_claim_processing_reduction_pct',
        'service_technician_utilization_current_pct', 'service_technician_utilization_lift_pct',
        'discount_rate_wacc_pct'
    ];
    const values = {};
    ids.forEach(id => values[id] = valOr(id, 0));
    values.scenario = currentScenario;
    values.savedAt = new Date().toLocaleString();
    return values;
}

function applyInputValues(values) {
    for (const [key, value] of Object.entries(values)) {
        if (key === 'scenario' || key === 'savedAt' || key === 'name') continue;
        const el = $(key);
        if (el) el.value = value;
    }
    if (values.scenario) {
        currentScenario = values.scenario;
        document.querySelectorAll('.scenario-tab').forEach(t => t.classList.remove('active'));
        const idx = values.scenario === 'conservative' ? 0 : values.scenario === 'realistic' ? 1 : 2;
        document.querySelectorAll('.scenario-tab')[idx].classList.add('active');
        $('scenarioDesc').textContent = scenarioPresets[values.scenario].description;
    }
    syncChangeSlidersFromTargets();
    updateCalculations();
}

function showSaveDialog() { $('saveModal').classList.add('visible'); $('scenarioNameInput').focus(); }
function closeSaveDialog() { $('saveModal').classList.remove('visible'); $('scenarioNameInput').value = ''; }

function saveScenario() {
    const name = $('scenarioNameInput').value.trim();
    if (!name) { alert('Please enter a name.'); return; }
    const scenarios = JSON.parse(localStorage.getItem('cartraV3Scenarios') || '{}');
    scenarios[name] = { ...getAllInputValues(), name };
    localStorage.setItem('cartraV3Scenarios', JSON.stringify(scenarios));
    closeSaveDialog();
    alert(`Scenario "${name}" saved.`);
}

function showLoadDialog() {
    const scenarios = JSON.parse(localStorage.getItem('cartraV3Scenarios') || '{}');
    const list = $('savedList');
    if (Object.keys(scenarios).length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#6b7280;padding:1.5rem;">No saved scenarios.</p>';
    } else {
        list.innerHTML = Object.entries(scenarios).map(([name, s]) => `
            <div style="border:1px solid #e5e7eb;border-radius:8px;padding:0.75rem;margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <strong>${name}</strong>
                    <div style="font-size:0.75rem;color:#6b7280;">${s.scenario} · ${s.savedAt}</div>
                </div>
                <div style="display:flex;gap:0.4rem;">
                    <button class="btn btn-outline btn-sm" onclick="loadScenario('${name}')">Load</button>
                    <button class="btn btn-outline btn-sm" style="color:#ef4444;border-color:#ef4444;" onclick="deleteScenario('${name}')">Delete</button>
                </div>
            </div>
        `).join('');
    }
    $('loadModal').classList.add('visible');
}
function closeLoadDialog() { $('loadModal').classList.remove('visible'); }

function loadScenario(name) {
    const scenarios = JSON.parse(localStorage.getItem('cartraV3Scenarios') || '{}');
    if (scenarios[name]) {
        applyInputValues(scenarios[name]);
        closeLoadDialog();
        alert(`Loaded "${name}".`);
    }
}
function deleteScenario(name) {
    if (!confirm(`Delete "${name}"?`)) return;
    const scenarios = JSON.parse(localStorage.getItem('cartraV3Scenarios') || '{}');
    delete scenarios[name];
    localStorage.setItem('cartraV3Scenarios', JSON.stringify(scenarios));
    showLoadDialog();
}

function resetCalculator() {
    if (!confirm('Reset all inputs to defaults?')) return;
    applyInputValues(scenarioPresets.realistic.params);
    // Reset baseline fields to spec defaults
    $('num_plants').value = 7;
    $('sell_through_pct').value = 95;
    $('realized_revenue_per_trailer').value = 2700;
    $('trailers_per_plant_day').value = 50;
    $('working_days_year').value = 250;
    $('trailers_per_truck_capacity').value = 4;
    $('avg_haul_miles').value = 500;
    $('freight_rate_per_mile').value = 2.65;
    $('change_order_premium_pct').value = 20;
    $('annual_qualified_opportunities').value = 40;
    $('marketing_pipeline_lift_pct').value = 5;
    $('avg_deal_size').value = 25000;
    $('deal_size_change_pct').value = 5;
    $('cross_sell_annual_revenue').value = 8000000;
    $('cross_sell_lift_pct').value = 6;
    if ($('prod_customer_sales_cost')) $('prod_customer_sales_cost').value = 2350000;
    if ($('prod_customer_sales_eff_pct')) $('prod_customer_sales_eff_pct').value = 25;
    if ($('prod_customer_sales_realization_pct')) $('prod_customer_sales_realization_pct').value = 80;
    if ($('prod_operations_cost')) $('prod_operations_cost').value = 1050000;
    if ($('prod_operations_eff_pct')) $('prod_operations_eff_pct').value = 32;
    if ($('prod_operations_realization_pct')) $('prod_operations_realization_pct').value = 80;
    if ($('prod_support_cost')) $('prod_support_cost').value = 560000;
    if ($('prod_support_eff_pct')) $('prod_support_eff_pct').value = 40;
    if ($('prod_support_realization_pct')) $('prod_support_realization_pct').value = 80;
    if ($('dealer_churn_current_pct')) $('dealer_churn_current_pct').value = 12;
    if ($('dealer_churn_reduction_pct')) $('dealer_churn_reduction_pct').value = 15;
    if ($('warranty_claim_processing_cost_current')) $('warranty_claim_processing_cost_current').value = 1500000;
    if ($('warranty_claim_processing_reduction_pct')) $('warranty_claim_processing_reduction_pct').value = 25;
    if ($('service_technician_utilization_current_pct')) $('service_technician_utilization_current_pct').value = 70;
    if ($('service_technician_utilization_lift_pct')) $('service_technician_utilization_lift_pct').value = 10;
    if ($('discount_rate_wacc_pct')) $('discount_rate_wacc_pct').value = 10;
    currentScenario = 'realistic';
    document.querySelectorAll('.scenario-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.scenario-tab')[1].classList.add('active');
    $('scenarioDesc').textContent = scenarioPresets.realistic.description;
    syncChangeSlidersFromTargets();
    updateCalculations();
}

function resetToBaseline() {
    if (!confirm('Reset to baseline assumptions with 0% projected change?')) return;

    // Keep user baseline assumptions as-is, but remove transformation deltas.
    const utilCurrent = val('utilization_current_pct');
    const coCurrent = val('change_order_current_pct');
    $('utilization_target_pct').value = utilCurrent;
    $('routing_empty_miles_reduction_pct').value = 0;
    $('change_order_target_pct').value = coCurrent;

    // Also zero projected CRM/CX improvement levers while keeping baseline volumes.
    $('marketing_pipeline_lift_pct').value = 0;
    $('deal_size_change_pct').value = 0;
    $('cross_sell_lift_pct').value = 0;
    if ($('prod_customer_sales_eff_pct')) $('prod_customer_sales_eff_pct').value = 0;
    if ($('prod_operations_eff_pct')) $('prod_operations_eff_pct').value = 0;
    if ($('prod_support_eff_pct')) $('prod_support_eff_pct').value = 0;
    if ($('dealer_churn_reduction_pct')) $('dealer_churn_reduction_pct').value = 0;
    if ($('warranty_claim_processing_reduction_pct')) $('warranty_claim_processing_reduction_pct').value = 0;
    if ($('service_technician_utilization_lift_pct')) $('service_technician_utilization_lift_pct').value = 0;

    // Reset investment values to active scenario defaults.
    const preset = scenarioPresets[currentScenario] || scenarioPresets.realistic;
    $('implementation_cost').value = preset.params.implementation_cost;
    $('annual_platform_cost').value = preset.params.annual_platform_cost;

    syncChangeSlidersFromTargets();
    updateCalculations();
}

// ---- Export: PDF ----
function exportToPDF() {
    const el = $('calculatorContent');
    html2canvas(el, { scale: 1.5, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4'); // landscape for wide layout
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW - 20;
        const imgH = (canvas.height * imgW) / canvas.width;
        let y = 10;
        pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH);
        let remaining = imgH - (pageH - 20);
        while (remaining > 0) {
            pdf.addPage();
            y = -(pageH - 20) + 10;
            pdf.addImage(imgData, 'PNG', 10, y - remaining + imgH, imgW, imgH);
            remaining -= (pageH - 20);
        }
        pdf.save(`Carry-On-Logistics-ROI-v3-${currentScenario}-${new Date().toISOString().split('T')[0]}.pdf`);
    });
}

// ---- Export: Excel ----
function exportToExcel() {
    const r = calculateROI();
    const data = [
        ['Carry-On Trailer — Logistics Transformation ROI v3.0'],
        ['Scenario', currentScenario.charAt(0).toUpperCase() + currentScenario.slice(1)],
        ['Generated', new Date().toLocaleString()],
        [''],
        ['=== KEY METRICS ==='],
        ['Total Annual Current Cost', fmt(r.totalCurrentCost)],
        ['Total Annual Target Cost', fmt(r.totalTargetCost)],
        ['Gross Annual Savings', fmt(r.grossSavings)],
        ['Net Annual Savings', fmt(r.netSavings)],
        ['Payback Period', r.paybackMonths !== Infinity ? r.paybackMonths.toFixed(1) + ' months' : 'N/A'],
        ['5-Year ROI', fmtPct(r.roi5year)],
        ['CRM + CX Gross Value', fmt(r.crmGrossValue)],
        ['Marketing Pipeline Value', fmt(r.marketingPipelineValue)],
        ['Sales Win-Rate Value', fmt(r.salesWinLiftValue)],
        ['Cross-Sell Value', fmt(r.crossSellValue)],
        ['Service Efficiency Value', fmt(r.serviceEfficiencyValue)],
        ['Retention Value', fmt(r.retentionValue)],
        ['Role Productivity Value (Total)', fmt(r.totalRoleProductivityValue)],
        ['Customer & Sales Productivity Value', fmt(r.customerSalesProductivityValue)],
        ['Operations Productivity Value', fmt(r.operationsProductivityValue)],
        ['Internal Support Productivity Value', fmt(r.supportProductivityValue)],
        ['Integrated Gross Value', fmt(r.integratedGrossSavings)],
        ['Integrated Net Value', fmt(r.integratedNetSavings)],
        ['Integrated 5-Year ROI', fmtPct(r.integratedROI5year)],
        [''],
        ['=== OPERATIONAL IMPACT ==='],
        ['Loads Eliminated/Year', fmtNum(r.loadsEliminated)],
        ['Change Orders Avoided/Year', fmtNum(r.changeOrdersAvoided)],
        ['Miles Eliminated/Year', fmtNum(r.milesEliminated)],
        [''],
        ['=== SAVINGS WATERFALL ==='],
        ['Current Freight Cost', fmt(r.currentFreightCost)],
        ['Capacity Savings', fmt(r.capacitySavings)],
        ['Routing Savings', fmt(r.routingSavings)],
        ['Change Order Savings', fmt(r.changeOrderSavings)],
        ['Target Cost', fmt(r.totalTargetCost)],
        [''],
        ['=== INVESTMENT ==='],
        ['Implementation Cost', fmt(r.implementation_cost)],
        ['Annual Platform Cost', fmt(r.annual_platform_cost)],
        ['Total 5-Year Investment', fmt(r.totalInvestment5yr)],
        [''],
        ['=== 5-YEAR PROJECTION ==='],
        ['Year', 'Current Cost', 'Transformed Cost', 'Net Savings', 'Cumulative']
    ];
    r.yearlyData.forEach(y => data.push([y.year, fmt(y.currentCost), fmt(y.transformedCost), fmt(y.netSavings), fmt(y.cumulative)]));

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ROI Analysis');
    XLSX.writeFile(wb, `Carry-On-Logistics-ROI-v3-${currentScenario}-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ---- Init ----
window.addEventListener('load', () => {
    updateCalculations();
    initCharts();
    // Bind all inputs
    document.querySelectorAll('.stepper-input, .slider').forEach(el => {
        el.addEventListener('input', updateCalculations);
        el.addEventListener('change', updateCalculations);
    });

    // Currency formatting UX for all $ inputs: raw while editing, formatted on blur.
    ['realized_revenue_per_trailer', 'avg_deal_size', 'cross_sell_annual_revenue', 'prod_customer_sales_cost', 'prod_operations_cost', 'prod_support_cost', 'implementation_cost', 'annual_platform_cost', 'warranty_claim_processing_cost_current'].forEach(id => {
        const input = $(id);
        if (!input) return;
        input.addEventListener('focus', () => {
            input.value = String(Math.round(parseNumeric(input.value)));
        });
        input.addEventListener('blur', () => {
            formatCurrencyInputs();
        });
    });

    formatCurrencyInputs();

    // Enter key in save dialog
    $('scenarioNameInput').addEventListener('keypress', e => { if (e.key === 'Enter') saveScenario(); });
});
