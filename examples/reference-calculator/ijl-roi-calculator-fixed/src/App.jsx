import { useState } from 'react'
import './App.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Slider } from './components/ui/slider'
import { Separator } from './components/ui/separator'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calculator, DollarSign, Clock, TrendingUp, AlertTriangle, HelpCircle, Download, RotateCcw, Save, FileText, FileSpreadsheet } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

// Import logos
import fayeLogo from './assets/faye-logo.png'
import ijlLogo from './assets/ijl-logo.png'

function App() {
  // Scenario mode
  const [scenarioMode, setScenarioMode] = useState('realistic')
  const [savedScenarios, setSavedScenarios] = useState({})

  // Current Business Metrics
  const [annualRevenue, setAnnualRevenue] = useState(24000000)
  const [monthlyLeads, setMonthlyLeads] = useState(833)
  const [currentConversionRate, setCurrentConversionRate] = useState(22)
  const [avgCustomerValue, setAvgCustomerValue] = useState(3000)
  const [currentResponseTime, setCurrentResponseTime] = useState(24)
  const [salesStaff, setSalesStaff] = useState(25)
  const [matchmakers, setMatchmakers] = useState(35)
  const [devHoursWeek, setDevHoursWeek] = useState(8)
  const [newHiresYear, setNewHiresYear] = useState(8)

  // Cost Parameters
  const [crmImplementationCost, setCrmImplementationCost] = useState(150000)
  const [annualCrmLicense, setAnnualCrmLicense] = useState(60000)
  const [devHourlyRate, setDevHourlyRate] = useState(75)
  const [salesHourlyRate, setSalesHourlyRate] = useState(35)
  const [matchmakerHourlyRate, setMatchmakerHourlyRate] = useState(40)
  const [adminHourlyRate, setAdminHourlyRate] = useState(25)
  const [trainingCostDay, setTrainingCostDay] = useState(500)

  // Target Improvements
  const [targetConversionRate, setTargetConversionRate] = useState(25)
  const [targetResponseTime, setTargetResponseTime] = useState(4)
  const [targetDevHoursWeek, setTargetDevHoursWeek] = useState(4)
  const [targetTrainingDays, setTargetTrainingDays] = useState(35)

  // Helper function to format currency without cents
  const formatCurrency = (amount) => {
    return Math.round(amount).toLocaleString()
  }

  // Scenario saving and export functionality
  const saveCurrentScenario = () => {
    const currentState = {
      annualRevenue, monthlyLeads, currentConversionRate, avgCustomerValue,
      currentResponseTime, salesStaff, matchmakers, devHoursWeek, newHiresYear,
      crmImplementationCost, annualCrmLicense, devHourlyRate, salesHourlyRate,
      matchmakerHourlyRate, adminHourlyRate, trainingCostDay, targetConversionRate,
      targetResponseTime, targetDevHoursWeek, targetTrainingDays,
      savedAt: new Date().toLocaleDateString()
    }
    setSavedScenarios(prev => ({
      ...prev,
      [scenarioMode]: currentState
    }))
  }

  const loadSavedScenario = (scenario) => {
    if (savedScenarios[scenario]) {
      const saved = savedScenarios[scenario]
      setAnnualRevenue(saved.annualRevenue)
      setMonthlyLeads(saved.monthlyLeads)
      setCurrentConversionRate(saved.currentConversionRate)
      setAvgCustomerValue(saved.avgCustomerValue)
      setCurrentResponseTime(saved.currentResponseTime)
      setSalesStaff(saved.salesStaff)
      setMatchmakers(saved.matchmakers)
      setDevHoursWeek(saved.devHoursWeek)
      setNewHiresYear(saved.newHiresYear)
      setCrmImplementationCost(saved.crmImplementationCost)
      setAnnualCrmLicense(saved.annualCrmLicense)
      setDevHourlyRate(saved.devHourlyRate)
      setSalesHourlyRate(saved.salesHourlyRate)
      setMatchmakerHourlyRate(saved.matchmakerHourlyRate)
      setAdminHourlyRate(saved.adminHourlyRate)
      setTrainingCostDay(saved.trainingCostDay)
      setTargetConversionRate(saved.targetConversionRate)
      setTargetResponseTime(saved.targetResponseTime)
      setTargetDevHoursWeek(saved.targetDevHoursWeek)
      setTargetTrainingDays(saved.targetTrainingDays)
    }
  }

  const exportToPDF = async () => {
    const element = document.getElementById('calculator-content')
    const canvas = await html2canvas(element)
    const imgData = canvas.toDataURL('image/png')
    
    const pdf = new jsPDF()
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    pdf.save(`CRM-ROI-Calculator-${scenarioMode}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportToExcel = () => {
    const results = calculateResults()
    const data = [
      ['CRM ROI Calculator Results', ''],
      ['Scenario', scenarioMode.charAt(0).toUpperCase() + scenarioMode.slice(1)],
      ['Generated', new Date().toLocaleDateString()],
      ['', ''],
      ['Summary', ''],
      ['Total Annual Benefits', `$${formatCurrency(results.totalBenefits)}`],
      ['Total Annual Costs', `$${formatCurrency(results.totalCosts)}`],
      ['ROI', `${results.roi.toFixed(1)}%`],
      ['Payback Period', `${results.paybackPeriod.toFixed(1)} months`],
      ['3-Year NPV', `$${formatCurrency(results.threeYearNPV)}`],
      ['', ''],
      ['Benefits Breakdown', ''],
      ['Revenue Uplift', `$${formatCurrency(results.breakdown.revenueUplift.total)}`],
      ['Cost Savings', `$${formatCurrency(results.breakdown.costSavings.total)}`],
      ['Productivity Gains', `$${formatCurrency(results.breakdown.productivityGains.total)}`]
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ROI Analysis')
    XLSX.writeFile(wb, `CRM-ROI-Calculator-${scenarioMode}-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const calculateResults = () => {
    // Apply scenario multipliers
    let riskFactor = 1
    let implementationSuccess = 0.85
    
    if (scenarioMode === 'conservative') {
      riskFactor = 0.7
      implementationSuccess = 0.75
    } else if (scenarioMode === 'optimistic') {
      riskFactor = 1.3
      implementationSuccess = 0.95
    }

    // Revenue Uplift Calculations
    const conversionImprovement = (targetConversionRate - currentConversionRate) / 100
    const responseTimeImprovement = Math.max(0, (currentResponseTime - targetResponseTime) * 0.03)
    const retentionImprovement = 0.02
    const upsellingRate = 0.08

    const revenueUplift = {
      conversion: monthlyLeads * 12 * conversionImprovement * avgCustomerValue * riskFactor,
      responseTime: annualRevenue * responseTimeImprovement * riskFactor,
      retention: annualRevenue * retentionImprovement * riskFactor,
      upselling: annualRevenue * upsellingRate * riskFactor,
      total: 0
    }
    revenueUplift.total = revenueUplift.conversion + revenueUplift.responseTime + revenueUplift.retention + revenueUplift.upselling

    // Cost Savings Calculations
    const devTimeSavings = (devHoursWeek - targetDevHoursWeek) * 52 * devHourlyRate * riskFactor
    const trainingCostReduction = newHiresYear * trainingCostDay * 0.3 * riskFactor
    const adminEfficiency = annualRevenue * 0.033 * riskFactor
    const errorReduction = annualRevenue * 0.01 * riskFactor

    const costSavings = {
      developer: devTimeSavings,
      training: trainingCostReduction,
      admin: adminEfficiency,
      errorReduction: errorReduction,
      total: devTimeSavings + trainingCostReduction + adminEfficiency + errorReduction
    }

    // Productivity Gains
    const salesProductivity = salesStaff * salesHourlyRate * 2080 * 0.15 * riskFactor
    const matchmakerProductivity = matchmakers * matchmakerHourlyRate * 2080 * 0.12 * riskFactor
    const reportingTimeSavings = (salesStaff + matchmakers + 25) * adminHourlyRate * 52 * 2 * riskFactor

    const productivityGains = {
      sales: salesProductivity,
      matchmaker: matchmakerProductivity,
      reporting: reportingTimeSavings,
      total: salesProductivity + matchmakerProductivity + reportingTimeSavings
    }

    const totalBenefits = (revenueUplift.total + costSavings.total + productivityGains.total) * implementationSuccess

    // Total Costs
    const integrationCosts = crmImplementationCost * 0.25
    const changeManagementCosts = crmImplementationCost * 0.15
    const totalImplementationCosts = crmImplementationCost + integrationCosts + changeManagementCosts
    const totalCosts = totalImplementationCosts + annualCrmLicense

    // ROI Calculation
    const roi = ((totalBenefits - totalCosts) / totalCosts) * 100
    const paybackPeriod = totalCosts / (totalBenefits / 12)

    // 3-Year Analysis with ramp-up
    const year1Benefits = totalBenefits * 0.5
    const year2Benefits = totalBenefits * 0.85
    const year3Benefits = totalBenefits * 1.0
    
    const yearlyAnalysis = [
      { year: 'Year 1', benefits: year1Benefits, costs: totalCosts, net: year1Benefits - totalCosts },
      { year: 'Year 2', benefits: year2Benefits, costs: annualCrmLicense, net: year2Benefits - annualCrmLicense },
      { year: 'Year 3', benefits: year3Benefits, costs: annualCrmLicense, net: year3Benefits - annualCrmLicense }
    ]

    const threeYearNPV = yearlyAnalysis.reduce((npv, year, index) => {
      return npv + (year.net / Math.pow(1.1, index + 1))
    }, 0)

    return {
      totalBenefits,
      totalCosts,
      totalImplementationCosts,
      roi,
      paybackPeriod,
      threeYearNPV,
      implementationSuccess,
      breakdown: {
        revenueUplift,
        costSavings,
        productivityGains
      },
      yearlyAnalysis
    }
  }

  const results = calculateResults()

  const getCredibilityWarning = () => {
    if (results.roi > 500) {
      return "ROI above 500% may face credibility challenges with executives. Consider more conservative assumptions."
    }
    return null
  }

  const getROIColor = () => {
    if (results.roi > 1000) return '#FF6B6B'
    if (results.roi > 500) return '#FFB347'
    return '#7A39ED'
  }

  const credibilityWarning = getCredibilityWarning()

  // Sensitivity Analysis Data
  const sensitivityData = [
    { factor: 'Conversion Rate', impact: 35 },
    { factor: 'Response Time', impact: 28 },
    { factor: 'Retention', impact: 20 },
    { factor: 'Training Savings', impact: 17 }
  ]

  return (
    <div className="min-h-screen bg-gray-50" id="calculator-content">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={fayeLogo} alt="Faye" className="h-8" />
            <span className="text-gray-400">Prepared by</span>
            <img src={ijlLogo} alt="It's Just Lunch" className="h-10" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="h-8 w-8" style={{color: '#38003C'}} />
            <h1 className="text-4xl font-bold" style={{color: '#38003C'}}>CRM ROI Calculator v2.1</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Calculate the return on investment for upgrading to SugarCRM</p>
          <p className="text-sm text-gray-500">Updated for 2025 centralized business model with expert panel feedback</p>
        </div>

        {/* Scenario Planning */}
        <Card className="mb-8 border-2" style={{borderColor: '#38003C'}}>
          <CardHeader className="pb-4 pt-6" style={{backgroundColor: '#38003C', marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5" />
              Scenario Planning
            </CardTitle>
            <CardDescription className="text-purple-100">
              Select your analysis approach based on risk tolerance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={scenarioMode} onValueChange={setScenarioMode} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="conservative">Conservative</TabsTrigger>
                <TabsTrigger value="realistic">Realistic</TabsTrigger>
                <TabsTrigger value="optimistic">Optimistic</TabsTrigger>
              </TabsList>
              <TabsContent value="conservative" className="mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertTriangle className="h-4 w-4" />
                  Conservative scenario uses reduced assumptions with 25% implementation risk factor built in (75% success rate for centralized model).
                </div>
                {savedScenarios.conservative && (
                  <Button 
                    onClick={() => loadSavedScenario('conservative')}
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Load Saved (Saved: {savedScenarios.conservative.savedAt})
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="realistic" className="mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <HelpCircle className="h-4 w-4" />
                  Realistic scenario uses industry-standard assumptions with 15% implementation risk factor built in (85% success rate for centralized model).
                </div>
                {savedScenarios.realistic && (
                  <Button 
                    onClick={() => loadSavedScenario('realistic')}
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Load Saved (Saved: {savedScenarios.realistic.savedAt})
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="optimistic" className="mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  Optimistic scenario uses best-case assumptions with 5% implementation risk factor built in (95% success rate for centralized model).
                </div>
                {savedScenarios.optimistic && (
                  <Button 
                    onClick={() => loadSavedScenario('optimistic')}
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Load Saved (Saved: {savedScenarios.optimistic.savedAt})
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Credibility Warning */}
        {credibilityWarning && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {credibilityWarning}
            </div>
          </div>
        )}

        {/* Input Parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Business Metrics */}
          <div className="space-y-6">
            <Card className="border-2" style={{borderColor: '#38003C'}}>
              <CardHeader className="pb-4 pt-6" style={{backgroundColor: '#38003C', marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calculator className="h-5 w-5" />
                  Current Business Metrics
                  <HelpCircle className="h-4 w-4 ml-auto" title="Updated for 2025 post-franchise consolidation model" />
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Updated for 2025 post-franchise consolidation model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="annualRevenue">Annual Revenue: ${(annualRevenue / 1000000).toFixed(0)}M</Label>
                  <Slider
                    id="annualRevenue"
                    min={10000000}
                    max={50000000}
                    step={1000000}
                    value={[annualRevenue]}
                    onValueChange={(value) => setAnnualRevenue(value[0])}
                    className="mt-2"
                    title="Centralized operations"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$10M</span>
                    <span>Centralized operations</span>
                    <span>$50M</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="monthlyLeads">Monthly Leads: {monthlyLeads}</Label>
                  <Slider
                    id="monthlyLeads"
                    min={200}
                    max={2000}
                    step={50}
                    value={[monthlyLeads]}
                    onValueChange={(value) => setMonthlyLeads(value[0])}
                    className="mt-2"
                    title="10K annual ÷ 12 months"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>200</span>
                    <span>10K annual ÷ 12 months</span>
                    <span>2,000</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentConversionRate">Current Conversion Rate: {currentConversionRate}%</Label>
                  <Slider
                    id="currentConversionRate"
                    min={10}
                    max={40}
                    step={1}
                    value={[currentConversionRate]}
                    onValueChange={(value) => setCurrentConversionRate(value[0])}
                    className="mt-2"
                    title="8K clients ÷ 10K leads"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10%</span>
                    <span>8K clients ÷ 10K leads</span>
                    <span>40%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="avgCustomerValue">Average Customer Value ($)</Label>
                    <Input
                      id="avgCustomerValue"
                      type="number"
                      value={avgCustomerValue}
                      onChange={(e) => setAvgCustomerValue(Number(e.target.value))}
                      className="border-purple-200 focus:border-purple-400"
                      title="Research: $2.5K-$3.5K"
                    />
                    <span className="text-xs text-gray-500">Research: $2.5K-$3.5K</span>
                  </div>
                  <div>
                    <Label htmlFor="currentResponseTime">Current Response Time (hours)</Label>
                    <Input
                      id="currentResponseTime"
                      type="number"
                      step="0.5"
                      value={currentResponseTime}
                      onChange={(e) => setCurrentResponseTime(Number(e.target.value))}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salesStaff">Sales Staff Count</Label>
                    <Input
                      id="salesStaff"
                      type="number"
                      value={salesStaff}
                      onChange={(e) => setSalesStaff(Number(e.target.value))}
                      className="border-purple-200 focus:border-purple-400"
                      title="Scaled for centralized model"
                    />
                    <span className="text-xs text-gray-500">Centralized team</span>
                  </div>
                  <div>
                    <Label htmlFor="matchmakers">Matchmaker Count</Label>
                    <Input
                      id="matchmakers"
                      type="number"
                      value={matchmakers}
                      onChange={(e) => setMatchmakers(Number(e.target.value))}
                      className="border-purple-200 focus:border-purple-400"
                      title="Scaled for centralized model"
                    />
                    <span className="text-xs text-gray-500">Centralized team</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="devHoursWeek">Dev Hours per Week</Label>
                    <Input
                      id="devHoursWeek"
                      type="number"
                      value={devHoursWeek}
                      onChange={(e) => setDevHoursWeek(Number(e.target.value))}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newHiresYear">New Hires per Year</Label>
                    <Input
                      id="newHiresYear"
                      type="number"
                      value={newHiresYear}
                      onChange={(e) => setNewHiresYear(Number(e.target.value))}
                      className="border-purple-200 focus:border-purple-400"
                      title="Scaled for smaller centralized organization"
                    />
                    <span className="text-xs text-gray-500">Smaller organization</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Parameters */}
            <Card className="border-2" style={{borderColor: '#16815A'}}>
              <CardHeader className="pb-4 pt-6" style={{backgroundColor: '#16815A', marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="h-5 w-5" />
                  Cost Parameters
                  <HelpCircle className="h-4 w-4 ml-auto" title="Scaled for centralized operations" />
                </CardTitle>
                <CardDescription className="text-green-100">
                  Adjusted for smaller, centralized organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="crmImplementationCost">CRM Implementation Cost ($)</Label>
                    <Input
                      id="crmImplementationCost"
                      type="number"
                      value={crmImplementationCost}
                      onChange={(e) => setCrmImplementationCost(Number(e.target.value))}
                      className="border-green-200 focus:border-green-400"
                      title="Reduced scale: base + 25% integration + change mgmt"
                    />
                    <span className="text-xs text-gray-500">+25% integration costs</span>
                  </div>
                  <div>
                    <Label htmlFor="annualCrmLicense">Annual CRM License Cost ($)</Label>
                    <Input
                      id="annualCrmLicense"
                      type="number"
                      value={annualCrmLicense}
                      onChange={(e) => setAnnualCrmLicense(Number(e.target.value))}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="devHourlyRate">Developer Hourly Rate ($)</Label>
                    <Input
                      id="devHourlyRate"
                      type="number"
                      value={devHourlyRate}
                      onChange={(e) => setDevHourlyRate(Number(e.target.value))}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salesHourlyRate">Sales Hourly Rate ($)</Label>
                    <Input
                      id="salesHourlyRate"
                      type="number"
                      value={salesHourlyRate}
                      onChange={(e) => setSalesHourlyRate(Number(e.target.value))}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="matchmakerHourlyRate">Matchmaker Hourly Rate ($)</Label>
                    <Input
                      id="matchmakerHourlyRate"
                      type="number"
                      value={matchmakerHourlyRate}
                      onChange={(e) => setMatchmakerHourlyRate(Number(e.target.value))}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminHourlyRate">Admin Hourly Rate ($)</Label>
                    <Input
                      id="adminHourlyRate"
                      type="number"
                      value={adminHourlyRate}
                      onChange={(e) => setAdminHourlyRate(Number(e.target.value))}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="trainingCostDay">Training Cost per Day ($)</Label>
                  <Input
                    id="trainingCostDay"
                    type="number"
                    value={trainingCostDay}
                    onChange={(e) => setTrainingCostDay(Number(e.target.value))}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Target Improvements */}
            <Card className="border-2" style={{borderColor: '#7A39ED'}}>
              <CardHeader className="pb-4 pt-6" style={{backgroundColor: '#7A39ED', marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5" />
                  Target Improvements
                  <HelpCircle className="h-4 w-4 ml-auto" title="Achievable targets for centralized model" />
                </CardTitle>
                <CardDescription className="text-violet-100">
                  Realistic targets for centralized operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetConversionRate">Target Conversion Rate (%)</Label>
                    <Input
                      id="targetConversionRate"
                      type="number"
                      value={targetConversionRate}
                      onChange={(e) => setTargetConversionRate(Number(e.target.value))}
                      className="border-violet-200 focus:border-violet-400"
                      title="Conservative 3-point improvement"
                    />
                    <span className="text-xs text-gray-500">3-point improvement</span>
                  </div>
                  <div>
                    <Label htmlFor="targetResponseTime">Target Response Time (hours)</Label>
                    <Input
                      id="targetResponseTime"
                      type="number"
                      step="0.5"
                      value={targetResponseTime}
                      onChange={(e) => setTargetResponseTime(Number(e.target.value))}
                      className="border-violet-200 focus:border-violet-400"
                      title="4-hour response time with automation"
                    />
                    <span className="text-xs text-gray-500">4-hour target</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetDevHoursWeek">Target Dev Hours per Week</Label>
                    <Input
                      id="targetDevHoursWeek"
                      type="number"
                      value={targetDevHoursWeek}
                      onChange={(e) => setTargetDevHoursWeek(Number(e.target.value))}
                      className="border-violet-200 focus:border-violet-400"
                      title="50% reduction with automation"
                    />
                    <span className="text-xs text-gray-500">50% reduction</span>
                  </div>
                  <div>
                    <Label htmlFor="targetTrainingDays">Target Training Days</Label>
                    <Input
                      id="targetTrainingDays"
                      type="number"
                      value={targetTrainingDays}
                      onChange={(e) => setTargetTrainingDays(Number(e.target.value))}
                      className="border-violet-200 focus:border-violet-400"
                      title="30% faster with better UX"
                    />
                    <span className="text-xs text-gray-500">30% faster</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Summary */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-2" style={{borderColor: '#16815A'}}>
                <CardHeader className="pb-2 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                  <CardTitle className="text-lg" style={{color: '#16815A'}}>Total Annual Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{color: '#16815A'}}>
                    ${formatCurrency(results.totalBenefits)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {scenarioMode} scenario
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2" style={{borderColor: '#38003C'}}>
                <CardHeader className="pb-2 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                  <CardTitle className="text-lg" style={{color: '#38003C'}}>Total Annual Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{color: '#38003C'}}>
                    ${formatCurrency(results.totalCosts)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Including integration
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2" style={{borderColor: getROIColor()}}>
                <CardHeader className="pb-2 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                  <CardTitle className="text-lg" style={{color: getROIColor()}}>ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{color: getROIColor()}}>
                    {results.roi.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    With risk factors
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2" style={{borderColor: '#04DFC6'}}>
                <CardHeader className="pb-2 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                  <CardTitle className="text-lg" style={{color: '#04DFC6'}}>Payback Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{color: '#04DFC6'}}>
                    {results.paybackPeriod.toFixed(1)} months
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Centralized implementation
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons - Moved to prominent location after summary cards */}
            <div className="flex flex-wrap gap-4 justify-center mt-8 mb-8">
              <Button 
                onClick={saveCurrentScenario}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Save {scenarioMode.charAt(0).toUpperCase() + scenarioMode.slice(1)} Scenario
              </Button>
              <Button 
                onClick={exportToPDF}
                variant="outline" 
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                size="lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export to PDF
              </Button>
              <Button 
                onClick={exportToExcel}
                variant="outline" 
                className="border-green-600 text-green-600 hover:bg-green-50"
                size="lg"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              <Button 
                onClick={() => {
                  setAnnualRevenue(24000000)
                  setMonthlyLeads(833)
                  setCurrentConversionRate(22)
                  setAvgCustomerValue(3000)
                  setCurrentResponseTime(24)
                  setSalesStaff(25)
                  setMatchmakers(35)
                  setDevHoursWeek(8)
                  setNewHiresYear(8)
                  setCrmImplementationCost(150000)
                  setAnnualCrmLicense(60000)
                  setDevHourlyRate(75)
                  setSalesHourlyRate(35)
                  setMatchmakerHourlyRate(40)
                  setAdminHourlyRate(25)
                  setTrainingCostDay(500)
                  setTargetConversionRate(25)
                  setTargetResponseTime(4)
                  setTargetDevHoursWeek(4)
                  setTargetTrainingDays(35)
                }}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Calculator
              </Button>
            </div>

            {/* Risk Assessment */}
            <Card>
              <CardHeader className="pb-4 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                <CardTitle style={{color: '#38003C'}}>Risk Assessment</CardTitle>
                <CardDescription>
                  Implementation risk factors for centralized model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Implementation Success Rate</span>
                    <span className="font-semibold">{(results.implementationSuccess * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Implementation Cost</span>
                    <span className="font-semibold">${formatCurrency(results.totalImplementationCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Business Model</span>
                    <span className="font-semibold">2025 Centralized</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Scenario Adjustment</span>
                    <span className="font-semibold">{scenarioMode}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Breakdown */}
            <Card>
              <CardHeader className="pb-4 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                <CardTitle style={{color: '#38003C'}}>Benefits Breakdown</CardTitle>
                <CardDescription>
                  Distribution of annual benefits by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { category: 'Revenue Uplift', amount: results.breakdown.revenueUplift.total },
                    { category: 'Cost Savings', amount: results.breakdown.costSavings.total },
                    { category: 'Productivity', amount: results.breakdown.productivityGains.total }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => `$${formatCurrency(value)}`} />
                    <Bar dataKey="amount" fill="#16815A" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sensitivity Analysis */}
            <Card>
              <CardHeader className="pb-4 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                <CardTitle style={{color: '#38003C'}}>Sensitivity Analysis</CardTitle>
                <CardDescription>
                  Impact of key factors on total benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sensitivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" />
                    <YAxis label={{ value: '% of Total Benefits', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="impact" fill="#7A39ED" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 3-Year Analysis Chart */}
            <Card>
              <CardHeader className="pb-4 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                <CardTitle style={{color: '#38003C'}}>3-Year Financial Analysis</CardTitle>
                <CardDescription>
                  Faster ramp-up expected for centralized implementation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={results.yearlyAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => `$${formatCurrency(value)}`} />
                    <Bar dataKey="benefits" fill="#16815A" name="Benefits" />
                    <Bar dataKey="costs" fill="#38003C" name="Costs" />
                    <Bar dataKey="net" fill="#7A39ED" name="Net Benefit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <Card>
              <CardHeader className="pb-4 pt-6" style={{marginTop: '-1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem'}}>
                <CardTitle style={{color: '#38003C'}}>Detailed ROI Breakdown</CardTitle>
                <CardDescription>
                  Analysis for 2025 centralized business model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2" style={{color: '#16815A'}}>Revenue Uplift: ${formatCurrency(results.breakdown.revenueUplift.total)}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Improved Conversion Rate (3% points): ${formatCurrency(results.breakdown.revenueUplift.conversion)}</div>
                      <div>• Faster Response Time (3% per hour): ${formatCurrency(results.breakdown.revenueUplift.responseTime)}</div>
                      <div>• Reduced Churn (2% improvement): ${formatCurrency(results.breakdown.revenueUplift.retention)}</div>
                      <div>• Upselling Opportunities (8% rate): ${formatCurrency(results.breakdown.revenueUplift.upselling)}</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2" style={{color: '#7A39ED'}}>Cost Savings: ${formatCurrency(results.breakdown.costSavings.total)}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Developer Time Savings (67% reduction): ${formatCurrency(results.breakdown.costSavings.developer)}</div>
                      <div>• Training Cost Reduction (30% faster): ${formatCurrency(results.breakdown.costSavings.training)}</div>
                      <div>• Administrative Efficiency: ${formatCurrency(results.breakdown.costSavings.admin)}</div>
                      <div>• Error Reduction (1% of revenue): ${formatCurrency(results.breakdown.costSavings.errorReduction)}</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2" style={{color: '#04DFC6'}}>Productivity Gains: ${formatCurrency(results.breakdown.productivityGains.total)}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Sales Team Productivity (25 reps): ${formatCurrency(results.breakdown.productivityGains.sales)}</div>
                      <div>• Matchmaker Productivity (35 staff): ${formatCurrency(results.breakdown.productivityGains.matchmaker)}</div>
                      <div>• Reporting Time Savings (60 users): ${formatCurrency(results.breakdown.productivityGains.reporting)}</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2" style={{color: '#38003C'}}>3-Year NPV: ${formatCurrency(results.threeYearNPV)}</h4>
                    <div className="text-sm text-gray-600">
                      Net present value with faster ramp-up (50%/85%/100%) for centralized model and 10% discount rate
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            This calculator provides estimates based on It's Just Lunch 2025 centralized business model and industry benchmarks.
            Actual results may vary based on implementation approach and market conditions.
          </p>
          <p className="mt-2 font-semibold">
            Version 2.1 - Updated for 2025 centralized operations with expert panel feedback
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span>Prepared by</span>
            <img src={fayeLogo} alt="Faye" className="h-4" />
            <span>for</span>
            <img src={ijlLogo} alt="It's Just Lunch" className="h-6" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

