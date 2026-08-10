Feature: Real-time threat notifications

  As a security administrator
  I want to receive threats in real time
  So that I can react immediately

  Scenario: Receive a newly detected threat

    Given an administrator is viewing the dashboard
    When SentinelMesh detects a critical threat
    Then the dashboard should receive the threat event
    And the threat should appear without a page refresh

  Scenario: Update threat counters

    Given an administrator is viewing the dashboard
    When a new threat is detected
    Then the relevant threat counters should be updated
