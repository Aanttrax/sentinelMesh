Feature: Request rate anomaly detection

  As SentinelMesh
  I want to detect abnormal request volumes
  So that traffic spikes can be identified

  Scenario: Detect an abnormal request rate

    Given an endpoint normally receives 20 requests per minute
    When the endpoint receives 2000 requests per minute
    Then a request rate anomaly should be detected

  Scenario: Accept normal traffic variation

    Given an endpoint normally receives 100 requests per minute
    When the endpoint receives 120 requests per minute
    Then no request rate anomaly should be detected

  Scenario: Detect a sudden traffic spike

    Given an endpoint normally receives 50 requests per minute
    When the request rate increases to 1000 requests per minute
    Then the detection severity should be high
