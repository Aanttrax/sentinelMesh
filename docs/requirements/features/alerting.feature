Feature: Alerting

  As a platform operator
  I want to receive alerts when threats exceed a threshold
  So that I can respond to security incidents in real time

  Scenario: Trigger alert on high-score threat
    Given a threat with a score above the configured threshold
    When the alerting engine processes it
    Then an alert is created and dispatched to the configured channels
