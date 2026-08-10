Feature: Error rate anomaly detection

  As SentinelMesh
  I want to monitor HTTP errors
  So that abnormal service behavior can be detected

  Scenario: Detect abnormal 5xx error rate

    Given a service normally has a 1 percent 5xx error rate
    When the 5xx error rate increases to 40 percent
    Then an error rate anomaly should be detected

  Scenario: Ignore normal error rates

    Given a service normally has a 1 percent 5xx error rate
    When the 5xx error rate is 2 percent
    Then no error rate anomaly should be created

  Scenario: Detect authentication failure spike

    Given a service normally has a low 401 response rate
    When the 401 response rate increases significantly
    Then an authentication failure detection should be created
