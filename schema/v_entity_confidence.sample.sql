-- legal-citation-gate schema samples
-- These DDL samples show the minimal table/view shapes the library expects.
-- Your actual schema may differ; the DataAdapter interface is the contract.

-- ---------------------------------------------------------------------------
-- v_entity_confidence
-- ---------------------------------------------------------------------------
-- The library calls DataAdapter.getEntityConfidence(entityIds: string[])
-- which should return rows matching EntityConfidenceRow from adapter.ts.
--
-- Minimal columns required:
--   entity_id        TEXT / UUID  -- must match entity_id values in cite tags
--   confidence_level TEXT         -- one of: platinum, gold, verified, high, medium, standard

CREATE TABLE IF NOT EXISTS entities (
  entity_id         TEXT PRIMARY KEY,
  entity_type       TEXT NOT NULL,          -- e.g. "case" | "statute" | "doctrine"
  display_name      TEXT,
  primary_citation  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_confidence_scores (
  entity_id         TEXT PRIMARY KEY REFERENCES entities(entity_id),
  confidence_level  TEXT NOT NULL
    CHECK (confidence_level IN ('platinum','gold','verified','high','medium','standard')),
  scored_at         TIMESTAMPTZ DEFAULT now(),
  scored_by         TEXT
);

-- View the library queries (via adapter):
CREATE OR REPLACE VIEW v_entity_confidence AS
  SELECT
    e.entity_id,
    e.entity_type,
    e.display_name,
    e.primary_citation,
    COALESCE(cs.confidence_level, 'standard') AS confidence_level
  FROM entities e
  LEFT JOIN entity_confidence_scores cs USING (entity_id);

-- ---------------------------------------------------------------------------
-- doctrine_quotes  (optional — only needed for pull-quote asides)
-- ---------------------------------------------------------------------------
-- The library calls DataAdapter.getDoctrineQuotes(entityIds: string[])
-- which should return rows matching DoctrineQuoteRow from adapter.ts.
--
-- Minimal columns required:
--   entity_id    TEXT  -- FK to entities
--   quote_text   TEXT  -- verbatim pull-quote
--   attribution  TEXT  -- optional — "Smith v. Jones, 123 U.S. 456 (2001)"

CREATE TABLE IF NOT EXISTS doctrine_quotes (
  entity_id    TEXT PRIMARY KEY REFERENCES entities(entity_id),
  quote_text   TEXT NOT NULL,
  attribution  TEXT
);

-- ---------------------------------------------------------------------------
-- charge_entity_map  (optional — used by buildEntityWhitelist charge path)
-- ---------------------------------------------------------------------------
-- The library calls DataAdapter.getChargeEntities(chargeId: string)
-- which should return EntityRow[] for a specific charge.

CREATE TABLE IF NOT EXISTS charge_entity_map (
  charge_id  TEXT NOT NULL,
  entity_id  TEXT NOT NULL REFERENCES entities(entity_id),
  rank       INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (charge_id, entity_id)
);

-- ---------------------------------------------------------------------------
-- Sample data
-- ---------------------------------------------------------------------------

INSERT INTO entities (entity_id, entity_type, display_name, primary_citation) VALUES
  ('miranda-v-arizona',   'case',     'Miranda v. Arizona',          '384 U.S. 436 (1966)'),
  ('4th-amendment',       'doctrine', 'Fourth Amendment',            NULL),
  ('exclusionary-rule',   'doctrine', 'Exclusionary Rule',           NULL),
  ('18-usc-922',          'statute',  '18 U.S.C. § 922',             NULL)
ON CONFLICT DO NOTHING;

INSERT INTO entity_confidence_scores (entity_id, confidence_level) VALUES
  ('miranda-v-arizona', 'platinum'),
  ('4th-amendment',     'gold'),
  ('exclusionary-rule', 'high'),
  ('18-usc-922',        'medium')
ON CONFLICT DO NOTHING;

INSERT INTO doctrine_quotes (entity_id, quote_text, attribution) VALUES
  ('4th-amendment',
   'The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated.',
   'U.S. Const. amend. IV'),
  ('exclusionary-rule',
   'Evidence obtained by police using methods that violate a defendant''s constitutional rights is generally inadmissible in criminal prosecutions.',
   NULL)
ON CONFLICT DO NOTHING;

INSERT INTO charge_entity_map (charge_id, entity_id, rank) VALUES
  ('dui-felony', 'miranda-v-arizona', 1),
  ('dui-felony', '4th-amendment',     2),
  ('dui-felony', 'exclusionary-rule', 3)
ON CONFLICT DO NOTHING;
