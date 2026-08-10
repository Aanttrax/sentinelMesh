Feature: Alert management

  As a security administrator
  I want to manage alerts
  So that important threats receive attention

  Scenario: Create an alert for a critical threat

    Given a threat has a score of 95
    When the threat is processed
    Then a critical alert should be created

  Scenario: Do not create an alert for low severity

    Given a threat has a score of 20
    When the threat is processed
    Then no critical alert should be created

  Scenario: Acknowledge an alert

    Given an open alert exists
    When an administrator acknowledges the alert
    Then the alert status should become "acknowledged"

  Scenario: Resolve an alert

    Given an acknowledged alert exists
    When an administrator resolves the alert
    Then the alert status should become "resolved"
