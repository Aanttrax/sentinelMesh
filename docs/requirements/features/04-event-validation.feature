Feature: Event validation

  As SentinelMesh
  I want to validate incoming events
  So that invalid data does not enter the processing pipeline

  Background:
    Given an active service named "payment-api" exists
    And the service has a valid API key

  Scenario: Reject an event without a method

    When I send an event without a method
    Then the event should be rejected
    And the system should return a validation error

  Scenario: Reject an event without a path

    When I send an event without a path
    Then the event should be rejected
    And the system should return a validation error

  Scenario: Reject an invalid status code

    When I send an event with status code 999
    Then the event should be rejected
    And the system should return a validation error

  Scenario: Reject a negative latency

    When I send an event with latency "-10"
    Then the event should be rejected
    And the system should return a validation error

  Scenario: Accept a valid event

    When I send an event with all required fields
    Then the event should pass validation
    And the event should enter the processing pipeline
