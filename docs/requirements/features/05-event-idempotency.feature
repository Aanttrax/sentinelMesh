Feature: Event idempotency

  As SentinelMesh
  I want to process each event only once
  So that duplicate events do not create duplicate results

  Background:
    Given an active service named "payment-api" exists
    And the service has a valid API key

  Scenario: Process an event once

    Given an event with identifier "evt-123" has not been processed
    When I send the event with identifier "evt-123"
    Then the event should be processed
    And exactly one processing record should exist

  Scenario: Ignore a duplicate event

    Given the event "evt-123" has already been processed
    When I send the same event again
    Then SentinelMesh should identify the event as a duplicate
    And the event should not be processed again
    And no duplicate detection should be created

  Scenario: Allow different events

    Given the event "evt-123" has already been processed
    When I send an event with identifier "evt-456"
    Then the new event should be processed normally
