Feature: Health checks

  As a platform operator
  I want health endpoints
  So that infrastructure can determine whether SentinelMesh is healthy

  Scenario: API health check

    Given the SentinelMesh API is running
    When I request "/health"
    Then the API should report a healthy status

  Scenario: Readiness check

    Given MongoDB and Redis are available
    When I request "/ready"
    Then SentinelMesh should report that it is ready

  Scenario: Readiness failure

    Given MongoDB is unavailable
    When I request "/ready"
    Then SentinelMesh should report that it is not ready
