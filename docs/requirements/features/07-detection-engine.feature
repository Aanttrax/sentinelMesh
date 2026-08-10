Feature: Detection engine

  As SentinelMesh
  I want to analyze HTTP events
  So that suspicious behavior can be identified

  Scenario: Analyze a normal event

    Given an event represents normal traffic
    When the detection engine analyzes the event
    Then no suspicious detection should be created

  Scenario: Analyze an anomalous event

    Given an event contains anomalous behavior
    When the detection engine analyzes the event
    Then a detection signal should be created

  Scenario: Detection should contain an explanation

    Given an anomalous event is detected
    When the detection is created
    Then it should contain a detection type
    And it should contain a severity
    And it should contain an explanation
