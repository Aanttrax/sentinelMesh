Feature: Node.js SDK

  As a Node.js API developer
  I want to integrate SentinelMesh with middleware
  So that HTTP events can be collected automatically

  Scenario: Initialize the SDK

    Given a valid SentinelMesh API key
    When I initialize the SentinelMesh middleware
    Then the middleware should initialize successfully

  Scenario: Capture an HTTP request

    Given the SentinelMesh middleware is installed
    When a request reaches the application
    Then the middleware should capture the request metadata

  Scenario: Capture the response

    Given the SentinelMesh middleware is installed
    When the application returns a response
    Then the middleware should capture the status code
    And the response latency

  Scenario: Do not block the application

    Given the SentinelMesh collector is temporarily unavailable
    When the application receives an HTTP request
    Then the application should continue processing the request
    And the SentinelMesh middleware should not block the response

  Scenario: Do not capture sensitive data

    Given a request contains an authorization header
    When the SentinelMesh middleware captures the request
    Then the authorization value should not be sent to SentinelMesh
