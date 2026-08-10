Feature: Anomaly Detection

  As a platform operator
  I want SentinelMesh to detect anomalous behavior in API traffic
  So that potential threats are identified early

  Scenario: Detect anomalous request pattern
    Given a stream of ingested events
    When a pattern deviates from the baseline
    Then an anomaly is flagged for threat scoring
