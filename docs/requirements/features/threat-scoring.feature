Feature: Threat Scoring

  As a platform operator
  I want detected anomalies to receive a threat score
  So that I can prioritize which threats to investigate

  Scenario: Calculate threat score for an anomaly
    Given a flagged anomaly
    When the scoring engine evaluates it
    Then a numeric threat score is assigned based on severity and context
