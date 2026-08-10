Feature: Brute force detection

  As SentinelMesh
  I want to detect repeated authentication failures
  So that brute force attacks can be identified

  Scenario: Detect repeated failed login attempts

    Given an authentication endpoint normally receives few failed requests
    When the same IP generates 500 failed login attempts within 60 seconds
    Then SentinelMesh should detect an authentication anomaly
    And the detection type should be "BRUTE_FORCE"

  Scenario: Ignore normal authentication failures

    Given an authentication endpoint normally receives 5 failed requests per minute
    When the endpoint receives 7 failed requests per minute
    Then no brute force detection should be created

  Scenario: Identify the source IP

    Given a brute force pattern is detected
    Then the detection should contain the source IP
