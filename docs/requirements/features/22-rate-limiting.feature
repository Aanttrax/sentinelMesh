Feature: Event ingestion rate limiting

  As SentinelMesh
  I want to limit event ingestion
  So that the platform is protected from excessive traffic

  Background:
    Given an active service named "payment-api" exists

  Scenario: Accept requests below the limit

    Given the service is allowed 100 events per minute
    When the service sends 50 events within one minute
    Then all events should be accepted

  Scenario: Reject requests above the limit

    Given the service is allowed 100 events per minute
    When the service sends 150 events within one minute
    Then requests above the limit should be rejected
    And the system should return HTTP status 429

  Scenario: Rate limits are isolated per service

    Given "payment-api" has a limit of 100 events per minute
    And "auth-api" has a limit of 100 events per minute
    When "payment-api" reaches its limit
    Then "auth-api" should still be allowed to send events
