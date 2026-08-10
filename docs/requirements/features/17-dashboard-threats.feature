Feature: Threat dashboard

  As a security administrator
  I want to inspect detected threats
  So that I can investigate suspicious activity

  Scenario: Display active threats

    Given SentinelMesh has 5 open threats
    When I open the threats page
    Then 5 open threats should be displayed

  Scenario: Display threat details

    Given a threat exists
    When I open the threat details
    Then I should see the threat score
    And the severity
    And the threat type
    And the affected service
    And the detection signals

  Scenario: Filter threats by severity

    Given threats with different severities exist
    When I filter threats by "critical"
    Then only critical threats should be displayed
