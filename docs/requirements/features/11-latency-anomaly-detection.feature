Feature: Latency anomaly detection

  As SentinelMesh
  I want to monitor endpoint latency
  So that performance anomalies can be identified

  Scenario: Detect abnormal latency

    Given an endpoint normally has a P95 latency of 150 milliseconds
    When the P95 latency increases to 2000 milliseconds
    Then a latency anomaly should be detected

  Scenario: Ignore normal latency variation

    Given an endpoint normally has a P95 latency of 150 milliseconds
    When the P95 latency is 180 milliseconds
    Then no latency anomaly should be created
