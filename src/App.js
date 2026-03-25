import { useState } from "react";

var BLUE   = "#003087";
var LBLUE  = "#0067B1";
var RED    = "#E4002B";
var GREEN  = "#00875A";
var AMBER  = "#FF8B00";
var PURPLE = "#6554C0";
var TEAL   = "#00A896";
var ORANGE = "#FF6B35";
var WHITE  = "#FFFFFF";
var G100   = "#F0F2F5";
var G200   = "#E2E6EC";
var G400   = "#9AAABF";
var G600   = "#5A6A82";
var G800   = "#2C3A4F";

// ── Ontology: Lines of Business ───────────────────────────────────────────────
var LINES_OF_BUSINESS = [
  { id:"HO3",  label:"HO-3 Homeowners",      category:"Personal Lines",   color:BLUE   },
  { id:"PA",   label:"Personal Auto",         category:"Personal Lines",   color:LBLUE  },
  { id:"CA",   label:"Commercial Auto",       category:"Commercial Lines", color:PURPLE },
  { id:"CPP",  label:"Commercial Package",    category:"Commercial Lines", color:PURPLE },
  { id:"WC",   label:"Workers Compensation",  category:"Commercial Lines", color:TEAL   },
];

// ── Schema Ontology Data ──────────────────────────────────────────────────────
var ONTOLOGY = {
  HO3: {
    summary: "HO-3 Special Form Homeowners policy. Open-peril dwelling, named-peril personal property. Configured via APD product model with GW entity extensions for state-specific caps.",
    migrationComplexity: "HIGH",
    migrationScore: 68,
    entityCount: 34,
    ruleCount: 127,
    tableCount: 22,
    customExtensions: 18,
    apd: {
      product: "HomeownersLine_HOE",
      version: "10.1.2",
      jurisdiction: ["FL","TX","CA","GA","OH"],
      coverageGroups: [
        { id:"CovA", name:"Dwelling Coverage A",         type:"Limit",   mandatory:true,  entity:"DwellingCov_HOE",       gwCloud:"DwellingCoverage" },
        { id:"CovB", name:"Other Structures Coverage B", type:"Limit",   mandatory:false, entity:"OtherStructuresCov_HOE",gwCloud:"OtherStructuresCoverage" },
        { id:"CovC", name:"Personal Property Coverage C",type:"Limit",   mandatory:true,  entity:"PersonalPropertyCov_HOE",gwCloud:"PersonalPropertyCoverage" },
        { id:"CovD", name:"Loss of Use Coverage D",      type:"Limit",   mandatory:true,  entity:"LossOfUseCov_HOE",      gwCloud:"LossOfUseCoverage" },
        { id:"CovE", name:"Personal Liability Coverage E",type:"Limit",  mandatory:true,  entity:"PersonalLiabCov_HOE",   gwCloud:"PersonalLiabilityCoverage" },
        { id:"CovF", name:"Medical Payments Coverage F", type:"Limit",   mandatory:false, entity:"MedPayCov_HOE",         gwCloud:"MedicalPaymentsCoverage" },
      ],
    },
    schemaEntities: [
      { entity:"PolicyPeriod",         type:"Core GW",    migrationRisk:"LOW",    customFields:2,  description:"Standard GW PolicyPeriod. Custom fields: FloodZoneCode, BuildingCodeGrade." },
      { entity:"DwellingCov_HOE",      type:"APD Custom", migrationRisk:"MEDIUM", customFields:8,  description:"Coverage A entity. Custom fields: ReplacementCostCalcMethod, StateCapOverride, InflationGuard, OrdinanceLawLimit, ValuationMethod, ExtendedRCLimit, CoinsurancePercentage, BuilderRiskFlag." },
      { entity:"HOLocation_HOE",       type:"APD Custom", migrationRisk:"HIGH",   customFields:14, description:"Property location entity. 14 custom fields including: WildFireScore, FloodZoneFEMA, CoastalWindZone, HailRiskScore, SinkholeRiskFL, RoofAgeMonths, RoofMaterial, ConstructionType, FoundationType, SquareFootage, YearBuilt, GarageType, PoolPresent, TrampolinePresent." },
      { entity:"PolicyValidationPlugin",type:"Gosu Rule", migrationRisk:"HIGH",   customFields:0,  description:"127 validation rules across 5 jurisdictions. State-specific coverage caps for CA/TX/FL. Minimum coverage rules. Underwriting referral thresholds." },
      { entity:"HOERatingEngine",      type:"Rating",     migrationRisk:"HIGH",   customFields:0,  description:"Custom rating algorithm for HO-3. Integrates ISO rating base with 22 state-specific rate tables. Non-standard for GW Cloud migration." },
      { entity:"HOEForms_HOE",         type:"APD Custom", migrationRisk:"MEDIUM", customFields:5,  description:"Policy form selection entity. State-specific mandatory forms. ISO HO-3 form plus 18 state endorsement forms." },
    ],
    relationships: [
      { from:"PolicyPeriod",    to:"HOLocation_HOE",        rel:"hasOneOrMore",  impact:"MEDIUM", note:"Location drives most rating and underwriting rules -- migrate carefully" },
      { from:"HOLocation_HOE",  to:"DwellingCov_HOE",       rel:"hasOne",        impact:"HIGH",   note:"Coverage limits validated against location risk scores -- 14 cross-entity rules" },
      { from:"DwellingCov_HOE", to:"PolicyValidationPlugin",rel:"validatedBy",   impact:"HIGH",   note:"Plugin reads CovA limit and location zip to apply state caps" },
      { from:"HOERatingEngine", to:"HOLocation_HOE",        rel:"ratesUsing",    impact:"HIGH",   note:"Rating algorithm depends on 8 custom location fields not in GW Cloud schema" },
      { from:"HOEForms_HOE",    to:"PolicyPeriod",          rel:"attachedTo",    impact:"MEDIUM", note:"18 state endorsement forms require form selection logic migration" },
    ],
    migrationIssues: [
      { severity:"CRITICAL", count:3, area:"Custom Rating",       detail:"HOERatingEngine uses 22 custom rate tables not supported in GW Cloud rating framework. Requires re-implementation in CloudRate or extraction to external rating engine." },
      { severity:"CRITICAL", count:2, area:"Location Entity",     detail:"HOLocation_HOE has 14 custom fields. GW Cloud Location entity supports 6 equivalents. 8 fields (WildFireScore, SinkholeRiskFL, CoastalWindZone etc.) require extension or external enrichment service." },
      { severity:"HIGH",     count:5, area:"Validation Rules",    detail:"127 Gosu validation rules in PolicyValidationPlugin. 42 rules reference custom fields not present in GW Cloud schema. Need rule-by-rule migration analysis." },
      { severity:"HIGH",     count:4, area:"State Coverage Caps", detail:"FL/TX/CA coverage caps implemented as hardcoded values in Gosu. GW Cloud requires parameterised configuration via Rating Tables. Refactor required." },
      { severity:"MEDIUM",   count:7, area:"APD Forms",           detail:"18 state endorsement forms use custom form selection logic. GW Cloud Forms Manager supports standard ISO forms but custom state logic needs re-implementation." },
      { severity:"LOW",      count:12,area:"Typekey Extensions",  detail:"12 custom TypeKeys added to GW typelists. Most have GW Cloud equivalents. 3 require new extension TypeKeys." },
    ],
    cloudMapping: [
      { onPrem:"HOLocation_HOE.WildFireScore",     cloud:"LocationEnrichment.WildfireRisk",    status:"PARTIAL",  action:"Use GW Cloud Location Enrichment API -- mapping required" },
      { onPrem:"HOLocation_HOE.SinkholeRiskFL",    cloud:"N/A",                                status:"GAP",      action:"FL sinkhole data not in GW Cloud -- integrate CoreLogic API" },
      { onPrem:"DwellingCov_HOE.StateCapOverride", cloud:"CovTermPattern.MaxValue",            status:"MAPPED",   action:"Map to GW Cloud CovTerm MaxValue parameter -- full equivalence" },
      { onPrem:"HOERatingEngine",                  cloud:"CloudRate or External",              status:"GAP",      action:"Custom ISO+state algorithm must be rebuilt or use external rating engine" },
      { onPrem:"PolicyValidationPlugin.gs",        cloud:"ValidationPlugin (Cloud)",           status:"PARTIAL",  action:"42 of 127 rules need rewrite for Cloud schema -- phased migration" },
      { onPrem:"HOEForms_HOE.StateFormSelection",  cloud:"FormsManager.StateRules",            status:"PARTIAL",  action:"ISO forms auto-migrate. 18 state endorsements need manual mapping" },
    ],
  },

  PA: {
    summary: "Personal Auto policy for private passenger vehicles. Standard ISO forms base with state-specific rating and UM/UIM configuration. Moderate migration complexity.",
    migrationComplexity: "MEDIUM",
    migrationScore: 52,
    entityCount: 28,
    ruleCount: 89,
    tableCount: 16,
    customExtensions: 11,
    apd: {
      product: "PersonalAutoLine_PALine",
      version: "10.1.2",
      jurisdiction: ["FL","TX","CA","GA","OH","NY"],
      coverageGroups: [
        { id:"BI",    name:"Bodily Injury Liability",       type:"SplitLimit", mandatory:true,  entity:"BICov_PALine",      gwCloud:"BodilyInjuryLiabilityCoverage" },
        { id:"PD",    name:"Property Damage Liability",     type:"Limit",      mandatory:true,  entity:"PDCov_PALine",      gwCloud:"PropertyDamageLiabilityCoverage" },
        { id:"UM",    name:"Uninsured Motorist BI",         type:"SplitLimit", mandatory:false, entity:"UMBICov_PALine",    gwCloud:"UninsuredMotoristCoverage" },
        { id:"COMP",  name:"Comprehensive",                 type:"Deductible", mandatory:false, entity:"CompCov_PALine",    gwCloud:"ComprehensiveCoverage" },
        { id:"COLL",  name:"Collision",                     type:"Deductible", mandatory:false, entity:"CollCov_PALine",    gwCloud:"CollisionCoverage" },
        { id:"PIP",   name:"Personal Injury Protection",    type:"Limit",      mandatory:false, entity:"PIPCov_PALine",     gwCloud:"PersonalInjuryProtectionCoverage" },
      ],
    },
    schemaEntities: [
      { entity:"PersonalAutoLine",   type:"Core GW",    migrationRisk:"LOW",    customFields:3,  description:"Standard PA line entity. Custom: TelemticsEnrolled, UsageBasedDiscount, DriveScoreAvg." },
      { entity:"PersonalVehicle",    type:"Core GW",    migrationRisk:"LOW",    customFields:6,  description:"Vehicle entity. Custom: AntiTheftDevice, SafetyRating, LeasedFlag, CommercialUseFlag, MileageCategory, GarageZip." },
      { entity:"Driver",             type:"Core GW",    migrationRisk:"MEDIUM", customFields:5,  description:"Driver entity. Custom: Excluded, ExclusionReason, ExclusionDate, GoodStudentVerified, DefensiveDrivingDate." },
      { entity:"BICov_PALine",       type:"APD Custom", migrationRisk:"LOW",    customFields:2,  description:"BI coverage. Custom: StackedFlag (FL only), UMRejectionOnFile." },
      { entity:"PALineValidation",   type:"Gosu Rule",  migrationRisk:"MEDIUM", customFields:0,  description:"89 validation rules. Key: FL PIP mandatory check, UM stacking elections, driver exclusion validation, multi-car discount eligibility." },
    ],
    relationships: [
      { from:"PersonalVehicle",   to:"BICov_PALine",        rel:"coveredBy",     impact:"LOW",    note:"Standard coverage relationship -- migrates cleanly" },
      { from:"Driver",            to:"PersonalVehicle",     rel:"drives",        impact:"MEDIUM", note:"Driver exclusion logic has 5 custom fields requiring careful migration" },
      { from:"PALineValidation",  to:"Driver",              rel:"validates",     impact:"MEDIUM", note:"Exclusion validation plugin reads custom Driver fields" },
      { from:"PersonalAutoLine",  to:"Driver",              rel:"hasMultiple",   impact:"LOW",    note:"Multi-driver household logic standard in GW Cloud" },
    ],
    migrationIssues: [
      { severity:"HIGH",     count:2, area:"FL PIP Logic",         detail:"FL PIP mandatory / waiver logic is complex Gosu implementation. GW Cloud PIP module exists but requires configuration for FL-specific stacking and coverage selection rules." },
      { severity:"HIGH",     count:3, area:"Telematics Integration",detail:"Custom telematics fields and DriveScore usage-based rating integration. GW Cloud has telematics API but different data model -- mapping required." },
      { severity:"MEDIUM",   count:5, area:"Driver Exclusion",     detail:"5 custom Driver fields for exclusion. GW Cloud Driver entity has exclusion support but custom exclusion reason codes need TypeKey migration." },
      { severity:"LOW",      count:8, area:"Rate Tables",          detail:"16 state rating tables in mostly standard format. 8 are ISO-based and will auto-migrate. 8 are custom state algorithms." },
    ],
    cloudMapping: [
      { onPrem:"PersonalAutoLine.TelemticsEnrolled",   cloud:"PALine.TelemticsEnabled",    status:"MAPPED",  action:"Direct field mapping -- rename only" },
      { onPrem:"BICov_PALine.StackedFlag",             cloud:"UMBICov.StackingElection",   status:"PARTIAL", action:"FL stacking logic must be reconfigured in GW Cloud UM module" },
      { onPrem:"Driver.Excluded",                      cloud:"Driver.ExcludedDriver",      status:"MAPPED",  action:"GW Cloud has native exclusion support -- migrate with TypeKey mapping" },
      { onPrem:"DriveScoreAvg (Telematics)",           cloud:"TelemticsAPI.ScoreField",    status:"GAP",     action:"GW Cloud telematics API endpoint -- integration rebuild required" },
    ],
  },

  CA: {
    summary: "Commercial Auto policy for business vehicles. Complex multi-vehicle, multi-driver, multi-jurisdiction. Highest validation rule count in the book.",
    migrationComplexity: "HIGH",
    migrationScore: 74,
    entityCount: 41,
    ruleCount: 183,
    tableCount: 28,
    customExtensions: 24,
    apd: {
      product: "CommercialAutoLine_CALine",
      version: "10.1.2",
      jurisdiction: ["FL","TX","CA","GA","OH"],
      coverageGroups: [
        { id:"CABI",  name:"Commercial Auto BI Liability",  type:"CSL",        mandatory:true,  entity:"CABICov_CALine",    gwCloud:"CommercialBILiabilityCoverage" },
        { id:"CAPD",  name:"Commercial Auto PD Liability",  type:"Limit",      mandatory:true,  entity:"CAPDCov_CALine",    gwCloud:"CommercialPDLiabilityCoverage" },
        { id:"CACOMP",name:"Commercial Comprehensive",      type:"Deductible", mandatory:false, entity:"CACompCov_CALine",  gwCloud:"CommercialComprehensiveCoverage" },
        { id:"CACOLL",name:"Commercial Collision",          type:"Deductible", mandatory:false, entity:"CACollCov_CALine",  gwCloud:"CommercialCollisionCoverage" },
        { id:"CAHIRE", name:"Hired Auto Liability",         type:"CSL",        mandatory:false, entity:"HiredAutoCov_CALine",gwCloud:"HiredAutoCoverage" },
        { id:"CANON",  name:"Non-Owned Auto Liability",     type:"CSL",        mandatory:false, entity:"NonOwnedAutoCov_CALine",gwCloud:"NonOwnedAutoCoverage" },
      ],
    },
    schemaEntities: [
      { entity:"CommercialVehicle",   type:"Core GW",    migrationRisk:"MEDIUM", customFields:9,  description:"Commercial vehicle. Custom: IFTA_Registration, DOT_Number, GVW_Class, HazMatEndorsement, TankEndorsement, PassengerCapacity, AnnualMileage, RadiusOfOperation, VehicleUsageCode." },
      { entity:"CommercialDriver",    type:"Core GW",    migrationRisk:"MEDIUM", customFields:6,  description:"Commercial driver. Custom: CDL_Class, CDL_Endorsements, MVR_Score, HireDate, ExperienceYears, LastMVRDate." },
      { entity:"FleetSchedule_CALine",type:"APD Custom", migrationRisk:"HIGH",   customFields:11, description:"Multi-vehicle fleet entity. 11 custom fields for fleet rating, blanket vs scheduled coverage, auto-add provisions." },
      { entity:"CALineValidation",    type:"Gosu Rule",  migrationRisk:"HIGH",   customFields:0,  description:"183 rules including: FMCSA compliance checks, DOT number validation, CDL endorsement matching, radius of operation rating class, fleet blanket eligibility." },
    ],
    relationships: [
      { from:"FleetSchedule_CALine",  to:"CommercialVehicle",    rel:"schedules",     impact:"HIGH",   note:"Fleet schedule entity is non-standard -- no direct GW Cloud equivalent" },
      { from:"CommercialVehicle",     to:"CABICov_CALine",       rel:"coveredBy",     impact:"MEDIUM", note:"CSL limits driven by vehicle GVW class -- 9 custom fields involved" },
      { from:"CALineValidation",      to:"CommercialDriver",     rel:"validates",     impact:"HIGH",   note:"183 rules include FMCSA/DOT compliance checks -- regulatory requirement" },
    ],
    migrationIssues: [
      { severity:"CRITICAL", count:4, area:"Fleet Schedule Entity",detail:"FleetSchedule_CALine has no GW Cloud equivalent. Multi-vehicle fleet rating with blanket/scheduled split and auto-add provisions requires new GW Cloud entity design." },
      { severity:"CRITICAL", count:3, area:"FMCSA Compliance",    detail:"183 rules include FMCSA/DOT regulatory checks. These are not in GW Cloud standard config. Need external compliance API or custom Cloud validation rules." },
      { severity:"HIGH",     count:6, area:"CDL/MVR Integration", detail:"Commercial driver CDL validation and MVR scoring integration. Custom Gosu integration to external MVR provider needs rebuild for GW Cloud API layer." },
      { severity:"HIGH",     count:5, area:"GVW Class Rating",    detail:"GVW-based commercial rating class uses 28 custom rate tables. Non-standard structure requires rating table rebuild or external rating engine." },
    ],
    cloudMapping: [
      { onPrem:"FleetSchedule_CALine",           cloud:"N/A -- New Design Required",      status:"GAP",     action:"Design new Fleet entity in GW Cloud. Significant architecture work -- 3-4 sprint effort." },
      { onPrem:"CommercialVehicle.DOT_Number",   cloud:"CommercialVehicle.DOTNumber",     status:"MAPPED",  action:"Direct mapping -- field rename only" },
      { onPrem:"CommercialDriver.CDL_Class",     cloud:"CommercialDriver.CDLClass",       status:"MAPPED",  action:"GW Cloud supports CDL class -- TypeKey mapping required" },
      { onPrem:"CALineValidation (FMCSA rules)", cloud:"External Compliance API",         status:"GAP",     action:"FMCSA rules require external API integration in GW Cloud -- new integration design" },
    ],
  },
};

var MIGRATION_COMPLEXITY = {
  HIGH:   { color:ORANGE, bg:"#FFF0EB" },
  MEDIUM: { color:AMBER,  bg:"#FFF8EC" },
  LOW:    { color:GREEN,  bg:"#E3FCEF" },
};

var RISK_THEME = {
  CRITICAL: { color:ORANGE, bg:"#FFF0EB" },
  HIGH:     { color:RED,    bg:"#FDECEA" },
  MEDIUM:   { color:AMBER,  bg:"#FFF8EC" },
  LOW:      { color:GREEN,  bg:"#E3FCEF" },
};

var STATUS_THEME = {
  MAPPED:   { color:GREEN,  label:"Mapped"   },
  PARTIAL:  { color:AMBER,  label:"Partial"  },
  GAP:      { color:RED,    label:"Gap"      },
};

var PHASES = [
  "Parsing GW on-premise schema DDL...",
  "Extracting APD product configuration...",
  "Building ontology relationship graph...",
  "Running AI semantic analysis...",
  "Generating migration complexity report...",
];

function NTTLogo() {
  return (
    <div style={{ display:"flex", flexDirection:"column", lineHeight:1 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
        <span style={{ fontFamily:"Arial Black,Arial", fontWeight:900, fontSize:20, color:BLUE }}>NTT</span>
        <span style={{ fontFamily:"Arial,sans-serif", fontWeight:700, fontSize:16, color:BLUE }}>DATA</span>
      </div>
      <div style={{ height:2, background:RED, marginTop:2, borderRadius:1 }}/>
    </div>
  );
}

function ScoreGauge(props) {
  var score = props.score;
  var color = score > 70 ? ORANGE : score > 45 ? AMBER : GREEN;
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:38, fontWeight:800, color:color, lineHeight:1 }}>{score}</div>
      <div style={{ fontSize:9, color:G400, letterSpacing:1, marginBottom:4 }}>{props.label}</div>
      <div style={{ height:6, background:G200, borderRadius:3, width:72, margin:"0 auto" }}>
        <div style={{ height:"100%", width:score+"%", background:color, borderRadius:3 }}/>
      </div>
    </div>
  );
}

export default function App() {
  var [selectedLOB, setSelectedLOB] = useState(null);
  var [ontology,    setOntology]    = useState(null);
  var [loading,     setLoading]     = useState(false);
  var [phaseIdx,    setPhaseIdx]    = useState(0);
  var [activeTab,   setActiveTab]   = useState("overview");
  var [doneMap,     setDoneMap]     = useState({});

  function runAnalysis(lob) {
    if (loading) return;
    setSelectedLOB(lob);
    setOntology(null);
    setLoading(true);
    setActiveTab("overview");
    setPhaseIdx(0);
    var p = 0;
    function tick() {
      p++; setPhaseIdx(p);
      if (p < PHASES.length - 1) setTimeout(tick, 650);
    }
    setTimeout(tick, 650);
    setTimeout(function() {
      var data = ONTOLOGY[lob.id];
      setOntology(data);
      setDoneMap(function(prev) { var n = Object.assign({}, prev); n[lob.id] = data; return n; });
      setLoading(false);
    }, 3500);
  }

  var totalEntities = Object.values(doneMap).reduce(function(s,d) { return s+d.entityCount; }, 0);
  var totalGaps     = Object.values(doneMap).reduce(function(s,d) {
    return s + d.migrationIssues.filter(function(i) { return i.severity==="CRITICAL"; }).length;
  }, 0);
  var avgScore = Object.values(doneMap).length
    ? Math.round(Object.values(doneMap).reduce(function(s,d) { return s+d.migrationScore; }, 0) / Object.values(doneMap).length)
    : 0;

  return (
    <div style={{ fontFamily:"'Segoe UI',Arial,sans-serif", background:G100, minHeight:"100vh", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ background:WHITE, borderBottom:"3px solid "+BLUE, padding:"10px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 6px rgba(0,0,0,0.07)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:18 }}>
          <NTTLogo/>
          <div style={{ width:1, height:30, background:G200 }}/>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:BLUE }}>GW Semantic Layer</div>
            <div style={{ fontSize:10, color:G600 }}>PolicyCenter On-Premise -- AI Ontology Mapper for Cloud Migration</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:20 }}>
          {[
            { v:LINES_OF_BUSINESS.length, l:"Lines of Business", c:BLUE   },
            { v:totalEntities||"--",       l:"Entities Mapped",   c:PURPLE },
            { v:totalGaps||"--",           l:"Critical Gaps",     c:ORANGE },
            { v:avgScore?avgScore+"%":"--",l:"Avg Migration Risk", c:AMBER },
          ].map(function(s) {
            return (
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800, color:s.c, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:9, color:G400, textTransform:"uppercase", letterSpacing:1 }}>{s.l}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Left sidebar -- LOB selector */}
        <div style={{ width:270, background:WHITE, borderRight:"1px solid "+G200, overflowY:"auto", padding:"14px 10px", flexShrink:0 }}>
          <div style={{ fontSize:10, fontWeight:700, color:G400, letterSpacing:2, marginBottom:10 }}>LINES OF BUSINESS</div>

          {["Personal Lines","Commercial Lines"].map(function(cat) {
            var lobs = LINES_OF_BUSINESS.filter(function(l) { return l.category === cat; });
            return (
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ fontSize:9, fontWeight:700, color:G600, marginBottom:6, textTransform:"uppercase", letterSpacing:1 }}>{cat}</div>
                {lobs.map(function(lob) {
                  var cached = doneMap[lob.id];
                  var isAct  = selectedLOB && selectedLOB.id === lob.id;
                  var mc     = cached ? MIGRATION_COMPLEXITY[cached.migrationComplexity] : null;
                  return (
                    <div key={lob.id} onClick={function() { runAnalysis(lob); }}
                      style={{ background:isAct?"#EBF2FF":WHITE, border:"1.5px solid "+(isAct?BLUE:G200), borderRadius:10, padding:"11px 12px", marginBottom:6, cursor:loading?"not-allowed":"pointer", opacity:loading&&!isAct?0.5:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:11, fontWeight:800, color:lob.color }}>{lob.id}</span>
                        {mc && <span style={{ fontSize:9, fontWeight:700, color:mc.color, background:mc.bg, border:"1px solid "+mc.color, borderRadius:3, padding:"0 5px" }}>{cached.migrationComplexity}</span>}
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:G800, marginBottom:3 }}>{lob.label}</div>
                      {cached && (
                        <div style={{ marginTop:4 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, fontSize:9 }}>
                            <span style={{ color:G400 }}>Migration risk</span>
                            <span style={{ color:mc.color, fontWeight:700 }}>{cached.migrationScore}%</span>
                          </div>
                          <div style={{ height:4, background:G200, borderRadius:2 }}>
                            <div style={{ height:"100%", width:cached.migrationScore+"%", background:mc.color, borderRadius:2 }}/>
                          </div>
                          <div style={{ display:"flex", gap:8, marginTop:4, fontSize:9, color:G400 }}>
                            <span>{cached.entityCount} entities</span>
                            <span>{cached.customExtensions} extensions</span>
                            <span>{cached.ruleCount} rules</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ padding:"10px 12px", background:G100, borderRadius:9, border:"1px solid "+G200, marginTop:4 }}>
            <div style={{ fontSize:9, fontWeight:700, color:G400, marginBottom:7, letterSpacing:1 }}>MIGRATION COMPLEXITY</div>
            {[["HIGH",ORANGE,"Significant rework required"],["MEDIUM",AMBER,"Moderate mapping effort"],["LOW",GREEN,"Mostly standard migration"]].map(function(r) {
              return (
                <div key={r[0]} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:r[1], flexShrink:0 }}/>
                  <span style={{ fontSize:9, color:G600 }}><strong>{r[0]}</strong> -- {r[2]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex:1, overflowY:"auto", padding:"18px 22px" }}>

          {!selectedLOB && !loading && (
            <div style={{ textAlign:"center", paddingTop:70, opacity:0.4 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>&#128202;</div>
              <div style={{ fontSize:15, fontWeight:700, color:G800 }}>Select a Line of Business to analyse</div>
              <div style={{ fontSize:12, color:G600, marginTop:6, lineHeight:1.8, maxWidth:500, margin:"6px auto 0" }}>
                The GW Semantic Layer reads your on-premise PolicyCenter schema DDL and APD product configuration, builds the ontology relationship map, identifies migration gaps, and generates the cloud mapping report.
              </div>
            </div>
          )}

          {loading && selectedLOB && (
            <div style={{ maxWidth:700 }}>
              <div style={{ background:WHITE, border:"1px solid "+G200, borderRadius:10, padding:"12px 16px", marginBottom:14 }}>
                <div style={{ fontSize:9, fontWeight:700, color:selectedLOB.color }}>LINE OF BUSINESS</div>
                <div style={{ fontSize:15, fontWeight:700, color:G800 }}>{selectedLOB.label} ({selectedLOB.id})</div>
              </div>
              <div style={{ background:WHITE, borderRadius:12, padding:"22px 20px", border:"1px solid "+G200 }}>
                <div style={{ fontSize:13, color:BLUE, fontWeight:700, marginBottom:18 }}>Analysing schema and building ontology map...</div>
                {PHASES.map(function(label, i) {
                  var done = i < phaseIdx;
                  var act  = i === phaseIdx;
                  var pct  = [20,40,60,80,100][i];
                  return (
                    <div key={i} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:act?BLUE:done?GREEN:G400, fontWeight:act?700:400 }}>
                          {done?"v ":act?"> ":"o "}{label}
                        </span>
                        <span style={{ fontSize:10, color:G400 }}>{done||act?pct:0}%</span>
                      </div>
                      <div style={{ height:4, background:G200, borderRadius:4 }}>
                        <div style={{ height:"100%", width:(done||act)?pct+"%":"0%", background:done?GREEN:act?BLUE:"transparent", borderRadius:4, transition:"width 0.5s" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && ontology && selectedLOB && (
            <div style={{ maxWidth:900 }}>

              {/* LOB Header */}
              <div style={{ background:WHITE, border:"1px solid "+G200, borderRadius:10, padding:"13px 16px", marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontSize:9, color:G400 }}>LINE OF BUSINESS</div>
                    <div style={{ fontSize:15, fontWeight:700, color:selectedLOB.color }}>{selectedLOB.label}</div>
                  </div>
                  <div style={{ width:1, height:36, background:G200 }}/>
                  <div><div style={{ fontSize:9, color:G400 }}>APD PRODUCT</div><div style={{ fontSize:12, fontWeight:700, color:G800, fontFamily:"monospace" }}>{ontology.apd.product}</div></div>
                  <div><div style={{ fontSize:9, color:G400 }}>VERSION</div><div style={{ fontSize:12, fontWeight:600, color:G800 }}>{ontology.apd.version}</div></div>
                  <div><div style={{ fontSize:9, color:G400 }}>JURISDICTIONS</div><div style={{ fontSize:11, fontWeight:600, color:PURPLE }}>{ontology.apd.jurisdiction.join(", ")}</div></div>
                </div>
                <div style={{ marginTop:8, fontSize:11, color:G600, lineHeight:1.65 }}>{ontology.summary}</div>
              </div>

              {/* Score banner */}
              {(function() {
                var mc = MIGRATION_COMPLEXITY[ontology.migrationComplexity];
                return (
                  <div style={{ marginBottom:14, padding:"14px 18px", background:WHITE, border:"2px solid "+mc.color, borderRadius:12, display:"flex", gap:18, flexWrap:"wrap", alignItems:"center" }}>
                    <ScoreGauge score={ontology.migrationScore} label="MIGRATION RISK"/>
                    <div style={{ width:1, height:52, background:G200 }}/>
                    {[
                      { l:"Complexity",          v:ontology.migrationComplexity, c:mc.color },
                      { l:"Schema Entities",      v:ontology.entityCount,         c:BLUE     },
                      { l:"Validation Rules",     v:ontology.ruleCount,           c:PURPLE   },
                      { l:"Rate Tables",          v:ontology.tableCount,          c:TEAL     },
                      { l:"Custom Extensions",    v:ontology.customExtensions,    c:AMBER    },
                      { l:"Coverage Groups",      v:ontology.apd.coverageGroups.length, c:GREEN },
                    ].map(function(m) {
                      return (
                        <div key={m.l} style={{ textAlign:"center", minWidth:70 }}>
                          <div style={{ fontSize:20, fontWeight:800, color:m.c }}>{m.v}</div>
                          <div style={{ fontSize:9, color:G400, marginTop:2 }}>{m.l}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Tabs */}
              <div style={{ display:"flex", marginBottom:14, borderBottom:"2px solid "+G200, flexWrap:"wrap" }}>
                {[
                  { k:"overview",  l:"Coverage Ontology" },
                  { k:"schema",    l:"Schema Entities" },
                  { k:"relations", l:"Relationship Map" },
                  { k:"issues",    l:"Migration Issues" },
                  { k:"mapping",   l:"Cloud Mapping" },
                ].map(function(tab) {
                  var a = activeTab === tab.k;
                  return (
                    <button key={tab.k} onClick={function() { setActiveTab(tab.k); }}
                      style={{ background:"transparent", border:"none", borderBottom:"3px solid "+(a?BLUE:"transparent"), color:a?BLUE:G600, padding:"7px 13px", fontSize:11, fontWeight:a?700:400, cursor:"pointer", marginBottom:-2 }}>
                      {tab.l}
                    </button>
                  );
                })}
              </div>

              {/* Coverage Ontology */}
              {activeTab === "overview" && (
                <div>
                  <div style={{ fontSize:11, color:G600, marginBottom:10 }}>APD coverage groups extracted from on-premise product configuration ({ontology.apd.product}):</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:8 }}>
                    {ontology.apd.coverageGroups.map(function(cg) {
                      var st = STATUS_THEME[cg.gwCloud ? "MAPPED" : "GAP"];
                      return (
                        <div key={cg.id} style={{ background:WHITE, borderRadius:9, padding:"12px 14px", border:"1px solid "+G200, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:10, fontWeight:700, color:BLUE, fontFamily:"monospace" }}>{cg.id}</span>
                            <span style={{ fontSize:9, color:GREEN, fontWeight:600 }}>MAPPED</span>
                          </div>
                          <div style={{ fontSize:12, fontWeight:700, color:G800, marginBottom:4 }}>{cg.name}</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:5 }}>
                            <span style={{ fontSize:9, color:PURPLE, border:"1px solid "+PURPLE, borderRadius:3, padding:"0 5px" }}>{cg.type}</span>
                            {cg.mandatory && <span style={{ fontSize:9, color:TEAL, border:"1px solid "+TEAL, borderRadius:3, padding:"0 5px" }}>Mandatory</span>}
                          </div>
                          <div style={{ fontSize:9, color:G400 }}>On-Prem: <span style={{ color:G600, fontFamily:"monospace" }}>{cg.entity}</span></div>
                          <div style={{ fontSize:9, color:G400, marginTop:2 }}>Cloud: <span style={{ color:GREEN, fontFamily:"monospace" }}>{cg.gwCloud}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schema Entities */}
              {activeTab === "schema" && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {ontology.schemaEntities.map(function(e, i) {
                    var rt = RISK_THEME[e.migrationRisk] || RISK_THEME.LOW;
                    var tc = e.type === "Core GW" ? BLUE : e.type === "APD Custom" ? PURPLE : e.type === "Rating" ? AMBER : TEAL;
                    return (
                      <div key={i} style={{ background:WHITE, borderRadius:9, padding:"12px 15px", border:"1px solid "+G200, borderLeft:"4px solid "+rt.color }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <div style={{ display:"flex", gap:7 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:G800, fontFamily:"monospace" }}>{e.entity}</span>
                            <span style={{ fontSize:9, color:tc, border:"1px solid "+tc, borderRadius:3, padding:"0 5px" }}>{e.type}</span>
                          </div>
                          <div style={{ display:"flex", gap:8 }}>
                            <span style={{ fontSize:9, fontWeight:700, color:rt.color, background:rt.bg, border:"1px solid "+rt.color, borderRadius:3, padding:"0 6px" }}>{e.migrationRisk} RISK</span>
                            {e.customFields > 0 && <span style={{ fontSize:9, color:AMBER }}>{e.customFields} custom fields</span>}
                          </div>
                        </div>
                        <div style={{ fontSize:11, color:G600, lineHeight:1.65 }}>{e.description}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Relationship Map */}
              {activeTab === "relations" && (
                <div>
                  <div style={{ fontSize:11, color:G600, marginBottom:10 }}>AI-extracted entity relationships from schema DDL and APD configuration analysis:</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {ontology.relationships.map(function(r, i) {
                      var ic = r.impact === "HIGH" ? ORANGE : r.impact === "MEDIUM" ? AMBER : GREEN;
                      return (
                        <div key={i} style={{ background:WHITE, borderRadius:9, padding:"12px 15px", border:"1px solid "+G200, display:"flex", gap:12, alignItems:"flex-start" }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:180, padding:"4px 0" }}>
                            <span style={{ fontSize:10, fontWeight:700, color:BLUE, fontFamily:"monospace", background:"#EBF2FF", padding:"3px 8px", borderRadius:4 }}>{r.from}</span>
                            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1, margin:"4px 0" }}>
                              <div style={{ width:1, height:6, background:G400 }}/>
                              <span style={{ fontSize:8, color:TEAL, background:TEAL+"15", border:"1px solid "+TEAL, borderRadius:8, padding:"1px 6px" }}>{r.rel}</span>
                              <div style={{ width:1, height:6, background:G400 }}/>
                            </div>
                            <span style={{ fontSize:10, fontWeight:700, color:PURPLE, fontFamily:"monospace", background:"#F0EBFF", padding:"3px 8px", borderRadius:4 }}>{r.to}</span>
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", gap:7, marginBottom:5 }}>
                              <span style={{ fontSize:9, fontWeight:700, color:ic, background:ic+"15", border:"1px solid "+ic, borderRadius:3, padding:"0 6px" }}>MIGRATION IMPACT: {r.impact}</span>
                            </div>
                            <div style={{ fontSize:11, color:G800, lineHeight:1.65 }}>{r.note}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Migration Issues */}
              {activeTab === "issues" && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
                    {["CRITICAL","HIGH","MEDIUM","LOW"].map(function(sev) {
                      var issues = ontology.migrationIssues.filter(function(i) { return i.severity===sev; });
                      var rt = RISK_THEME[sev];
                      var total = issues.reduce(function(s,i) { return s+i.count; }, 0);
                      return (
                        <div key={sev} style={{ background:rt.bg, border:"1px solid "+rt.color, borderRadius:9, padding:"12px 14px", textAlign:"center" }}>
                          <div style={{ fontSize:28, fontWeight:800, color:rt.color }}>{total}</div>
                          <div style={{ fontSize:10, fontWeight:700, color:rt.color }}>{sev}</div>
                          <div style={{ fontSize:9, color:G400 }}>{issues.length} issue type{issues.length!==1?"s":""}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {ontology.migrationIssues.map(function(issue, i) {
                      var rt = RISK_THEME[issue.severity] || RISK_THEME.LOW;
                      return (
                        <div key={i} style={{ background:WHITE, borderRadius:9, padding:"12px 15px", border:"1px solid "+G200, borderLeft:"4px solid "+rt.color }}>
                          <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                            <span style={{ fontSize:9, fontWeight:700, color:rt.color, background:rt.bg, border:"1px solid "+rt.color, borderRadius:3, padding:"0 6px" }}>{issue.severity}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:G800 }}>{issue.area}</span>
                            <span style={{ fontSize:9, color:G400, marginLeft:"auto" }}>{issue.count} occurrence{issue.count!==1?"s":""}</span>
                          </div>
                          <div style={{ fontSize:11, color:G600, lineHeight:1.7 }}>{issue.detail}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cloud Mapping */}
              {activeTab === "mapping" && (
                <div>
                  <div style={{ fontSize:11, color:G600, marginBottom:10 }}>Field-level and entity-level mapping from on-premise schema to GW Cloud target schema:</div>
                  {(function() {
                    var mapped  = ontology.cloudMapping.filter(function(m) { return m.status==="MAPPED"; }).length;
                    var partial = ontology.cloudMapping.filter(function(m) { return m.status==="PARTIAL"; }).length;
                    var gaps    = ontology.cloudMapping.filter(function(m) { return m.status==="GAP"; }).length;
                    return (
                      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                        {[{l:"Mapped",mapped,v:mapped,c:GREEN},{l:"Partial",v:partial,c:AMBER},{l:"Gaps",v:gaps,c:RED}].map(function(s) {
                          return (
                            <div key={s.l} style={{ flex:1, background:WHITE, border:"1px solid "+G200, borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
                              <div style={{ fontSize:24, fontWeight:700, color:s.c }}>{s.v}</div>
                              <div style={{ fontSize:10, color:G400 }}>{s.l}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {ontology.cloudMapping.map(function(m, i) {
                      var st = STATUS_THEME[m.status] || STATUS_THEME.GAP;
                      return (
                        <div key={i} style={{ background:WHITE, borderRadius:9, padding:"12px 15px", border:"1px solid "+G200 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                            <div>
                              <div style={{ fontSize:9, color:G400, marginBottom:2 }}>ON-PREMISE</div>
                              <div style={{ fontSize:11, fontWeight:700, color:G800, fontFamily:"monospace" }}>{m.onPrem}</div>
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 14px" }}>
                              <div style={{ fontSize:14, color:st.color }}>--&gt;</div>
                              <span style={{ fontSize:9, fontWeight:700, color:st.color, border:"1px solid "+st.color, borderRadius:3, padding:"1px 6px", marginTop:2 }}>{st.label}</span>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:9, color:G400, marginBottom:2 }}>GW CLOUD TARGET</div>
                              <div style={{ fontSize:11, fontWeight:700, color:m.status==="GAP"?RED:GREEN, fontFamily:"monospace" }}>{m.cloud}</div>
                            </div>
                          </div>
                          <div style={{ padding:"6px 10px", background:G100, borderRadius:6, fontSize:10, color:G800 }}>
                            <strong>Action: </strong>{m.action}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:WHITE, borderTop:"1px solid "+G200, padding:"6px 24px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:GREEN }}/>
          <span style={{ fontSize:10, color:GREEN, fontWeight:700 }}>PoC -- Simulated Schema Analysis</span>
        </div>
        {["PolicyCenter On-Prem","APD Config","Schema DDL","Claude Sonnet (Prod)","Neo4j Ontology Graph (Prod)","GW Cloud Target"].map(function(t) {
          return <span key={t} style={{ fontSize:9, color:G600, border:"1px solid "+G200, padding:"2px 7px", borderRadius:3, background:G100 }}>{t}</span>;
        })}
        <span style={{ marginLeft:"auto", fontSize:10, color:G400 }}>NTT DATA -- GW Semantic Layer 2025</span>
      </div>
    </div>
  );
}
