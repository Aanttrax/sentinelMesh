Feature: Service registration

  As a system administrator
  I want to register API services
  So that SentinelMesh can monitor them

  Background:
    Given I am an authenticated administrator

  Scenario: Register a new service

    Given no service named "payment-api" exists
    When I register the service "payment-api"
    And the environment is "production"
    And the version is "1.0.0"
    Then the service should be created
    And the service should have a unique identifier
    And the service status should be "active"

  Scenario: Prevent duplicate service registration

    Given a service named "payment-api" already exists
    When I try to register another service named "payment-api"
    Then the request should be rejected
    And the system should return a conflict error

  Scenario: List registered services

    Given the following services exist:
      | name             | environment |
      | payment-api      | production  |
      | authentication   | production  |
      | quote-api        | staging     |
    When I request the list of services
    Then the response should contain 3 services

  Scenario: Get a service

    Given a service named "payment-api" exists
    When I request the service details
    Then the service information should be returned

  Scenario: Disable a service

    Given an active service named "payment-api" exists
    When I disable the service
    Then the service status should become "disabled"

  Scenario: Prevent events from disabled services

    Given a disabled service named "payment-api" exists
    When the service attempts to send an event
    Then the event should be rejected
