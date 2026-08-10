Feature: SentinelMesh gateway

  As an API owner
  I want to monitor my API without modifying its source code
  So that SentinelMesh can be adopted without application changes

  Scenario: Forward a request to an upstream API

    Given an upstream API is configured
    When a client sends a request through the SentinelMesh gateway
    Then the gateway should forward the request to the upstream API
    And return the upstream response to the client

  Scenario: Capture gateway traffic

    Given an upstream API is configured
    When a request passes through the gateway
    Then the gateway should generate an HTTP event
    And send the event to SentinelMesh

  Scenario: Preserve upstream behavior

    Given an upstream API returns HTTP 200
    When the request passes through the gateway
    Then the client should receive HTTP 200
