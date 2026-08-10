Feature: API key management

  As a system administrator
  I want to manage service API keys
  So that services can securely authenticate with SentinelMesh

  Background:
    Given an active service named "payment-api" exists

  Scenario: Generate an API key

    When I generate an API key for "payment-api"
    Then a new API key should be created
    And the API key should be associated with "payment-api"
    And the full API key should only be displayed once

  Scenario: Authenticate using a valid API key

    Given "payment-api" has a valid API key
    When the service authenticates using the API key
    Then authentication should succeed

  Scenario: Reject an invalid API key

    Given "payment-api" has a valid API key
    When the service authenticates using an invalid API key
    Then authentication should fail
    And the system should return an unauthorized response

  Scenario: Revoke an API key

    Given "payment-api" has an active API key
    When I revoke the API key
    Then the API key should become inactive
    And requests using the revoked key should be rejected

  Scenario: Rotate an API key

    Given "payment-api" has an active API key
    When I rotate the API key
    Then the old API key should become inactive
    And a new API key should be generated
    And the new API key should authenticate successfully
