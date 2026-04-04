import { useState, useEffect } from "react";

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

// ── Lines of Business and Ontology are loaded dynamically from /data/ ────────

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
  var [lobs,        setLobs]        = useState([]);
  var [selectedLOB, setSelectedLOB] = useState(null);
  var [ontology,    setOntology]    = useState(null);
  var [loading,     setLoading]     = useState(false);
  var [phaseIdx,    setPhaseIdx]    = useState(0);
  var [activeTab,   setActiveTab]   = useState("overview");
  var [doneMap,     setDoneMap]     = useState({});
  var [fetchError,  setFetchError]  = useState(null);

  useEffect(function() {
    fetch(process.env.PUBLIC_URL + "/data/lobs.json")
      .then(function(r) { return r.json(); })
      .then(setLobs)
      .catch(function(err) { setFetchError("Failed to load lines of business: " + err.message); });
  }, []);

  function runAnalysis(lob) {
    if (loading) return;
    setSelectedLOB(lob);
    setOntology(null);
    setFetchError(null);
    setLoading(true);
    setActiveTab("overview");
    setPhaseIdx(0);
    var p = 0;
    function tick() {
      p++; setPhaseIdx(p);
      if (p < PHASES.length - 1) setTimeout(tick, 650);
    }
    setTimeout(tick, 650);
    fetch(process.env.PUBLIC_URL + "/data/ontology/" + lob.id + ".json")
      .then(function(r) {
        if (!r.ok) throw new Error("No ontology data for " + lob.id);
        return r.json();
      })
      .then(function(data) {
        setOntology(data);
        setDoneMap(function(prev) { var n = Object.assign({}, prev); n[lob.id] = data; return n; });
        setLoading(false);
      })
      .catch(function(err) {
        setFetchError(err.message);
        setLoading(false);
      });
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
            { v:lobs.length||"--",         l:"Lines of Business", c:BLUE   },
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
            var catLobs = lobs.filter(function(l) { return l.category === cat; });
            return (
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ fontSize:9, fontWeight:700, color:G600, marginBottom:6, textTransform:"uppercase", letterSpacing:1 }}>{cat}</div>
                {catLobs.map(function(lob) {
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

          {fetchError && (
            <div style={{ background:"#FDECEA", border:"1px solid "+RED, borderRadius:8, padding:"12px 16px", marginBottom:14, color:RED, fontSize:12, fontWeight:600 }}>
              {fetchError}
            </div>
          )}

          {!selectedLOB && !loading && !fetchError && (
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
                      /*var st = STATUS_THEME[cg.gwCloud ? "MAPPED" : "GAP"];*/
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
