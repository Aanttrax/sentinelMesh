Feature: HTTP event ingestion

  As a monitored API
  I want to send HTTP events to SentinelMesh
  So that my traffic can be analyzed

  Background:
    Given an active service named "payment-api" exists
    And the service has a valid API key

  Scenario: Accept a valid HTTP event

    When I send the following HTTP event:
      | method     | POST       |
      | path       | /payments  |
      | statusCode | 200        |
      | latencyMs  | 150        |
    Then SentinelMesh should accept the event
    And the event should receive a unique identifier
    And the event should be published to the processing queue

  Scenario: Return accepted status for asynchronous processing

    When I send a valid HTTP event
    Then SentinelMesh should return HTTP status 202
    And the response should contain the event identifier

  Scenario: Reject an unauthenticated event

    Given I do not provide an API key
    When I send a valid HTTP event
    Then SentinelMesh should return HTTP status 401

  Scenario: Reject an invalid API key

    Given I provide an invalid API key
    When I send a valid HTTP event
    Then SentinelMesh should return HTTP status 401
