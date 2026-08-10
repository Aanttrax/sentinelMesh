Feature: Security dashboard overview

  As a security administrator
  I want to see an overview of my monitored environment
  So that I can understand its current security state

  Scenario: Display service statistics

    Given SentinelMesh monitors 5 services
    When I open the dashboard
    Then the dashboard should display 5 monitored services

  Scenario: Display event statistics

    Given SentinelMesh has processed 100000 events
    When I open the dashboard
    Then the dashboard should display the event count

  Scenario: Display threat statistics

    Given SentinelMesh has detected 20 threats
    When I open the dashboard
    Then the dashboard should display the threat count

  Scenario: Display severity statistics

    Given the system contains threats of different severities
    When I open the dashboard
    Then the dashboard should display counts by severity
