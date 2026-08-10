Feature: Suspicious IP detection

  As SentinelMesh
  I want to identify suspicious IP behavior
  So that potentially malicious sources can be investigated

  Scenario: Detect abnormal behavior from an IP

    Given an IP generates an unusually high number of requests
    And the IP generates a high number of authentication failures
    When SentinelMesh analyzes the IP behavior
    Then the IP should be marked as suspicious

  Scenario: Track IP activity across endpoints

    Given an IP accesses multiple endpoints
    When SentinelMesh analyzes the IP activity
    Then the activity should be associated with the IP
    And the activity should be available for threat analysis
