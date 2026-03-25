PoC — GW Semantic Layer (gw_semantic_poc.jsx)
Paste into claude.ai → new chat → artifact/code. Three Lines of Business pre-loaded with real GW domain knowledge:
LOBMigration RiskEntitiesRulesCritical GapsHO-3 Homeowners68/100 HIGH34127Custom rating engine (22 tables), Location entity (8 of 14 fields have no Cloud equivalent), 42 rules referencing absent fieldsPersonal Auto52/100 MEDIUM2889FL PIP stacking logic, telematics DriveScore integrationCommercial Auto74/100 HIGH41183FleetSchedule entity has no GW Cloud equivalent, FMCSA regulatory compliance rules
Each LOB shows 5 tabs after the 5-phase animated pipeline:

Coverage Ontology — every APD coverage group with on-prem entity name, Cloud target entity, type (Limit/Deductible/CSL), and mandatory flag
Schema Entities — each entity with migration risk (CRITICAL/HIGH/MEDIUM/LOW), custom field count, and description of what those fields do
Relationship Map — AI-extracted entity relationships showing how entities depend on each other and which dependencies create migration risk
Migration Issues — prioritised CRITICAL/HIGH/MEDIUM/LOW issue list with counts, affected areas, and exactly what needs to be done
Cloud Mapping — field-by-field comparison table: On-Premise field → GW Cloud target → Mapped/Partial/Gap → specific migration action
