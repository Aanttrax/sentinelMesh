Feature: Threat lifecycle

  As a security administrator
  I want to manage the lifecycle of threats
  So that security incidents can be tracked

  Scenario: Create an open threat

    Given a detection exceeds the threat threshold
    When the threat engine processes the detection
    Then a threat should be created
    And the threat status should be "open"

  Scenario: Investigate a threat

    Given an open threat exists
    When an administrator starts investigating the threat
    Then the threat status should become "investigating"

  Scenario: Resolve a threat

    Given a threat is being investigated
    When an administrator resolves the threat
    Then the threat status should become "resolved"

  Scenario: Ignore a false positive

    Given an open threat is determined to be a false positive
    When an administrator ignores the threat
    Then the threat status should become "ignored"
