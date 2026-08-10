Feature: Threat scoring

  As SentinelMesh
  I want to calculate a threat score
  So that the severity of suspicious behavior can be quantified

  Scenario: Calculate a low risk score

    Given a detection has low severity signals
    When the threat engine evaluates the signals
    Then the threat score should be between 0 and 39
    And the severity should be "low"

  Scenario: Calculate a medium risk score

    Given a detection has moderate severity signals
    When the threat engine evaluates the signals
    Then the threat score should be between 40 and 69
    And the severity should be "medium"

  Scenario: Calculate a high risk score

    Given a detection has high severity signals
    When the threat engine evaluates the signals
    Then the threat score should be between 70 and 89
    And the severity should be "high"

  Scenario: Calculate a critical risk score

    Given a detection has critical severity signals
    When the threat engine evaluates the signals
    Then the threat score should be between 90 and 100
    And the severity should be "critical"

  Scenario: Never exceed the maximum score

    Given multiple detection signals produce a score greater than 100
    When the threat engine calculates the final score
    Then the score should be capped at 100
