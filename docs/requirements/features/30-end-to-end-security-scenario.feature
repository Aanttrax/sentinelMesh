Feature: End-to-end security monitoring

  As a security administrator
  I want SentinelMesh to detect a security incident
  So that I can investigate and respond to suspicious behavior

  Scenario: Detect and display a brute force attack

    Given an "auth-api" service is registered
    And the service has a valid SentinelMesh API key
    And the authentication endpoint normally receives low traffic

    When the service receives 500 failed login attempts
    And the attempts originate from the same IP address
    And the attempts occur within 60 seconds

    Then SentinelMesh should accept the HTTP events
    And publish the events to the processing queue
    And a detection worker should process the events
    And an authentication anomaly should be detected
    And a brute force detection should be created
    And a threat should be created
    And the threat should have a score greater than 70
    And the threat severity should be "high" or "critical"
    And the threat should be stored
    And an alert should be created
    And the threat should appear in the dashboard
