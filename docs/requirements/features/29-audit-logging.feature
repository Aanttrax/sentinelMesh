Feature: Audit logging

  As a security administrator
  I want important actions to be recorded
  So that system activity can be investigated

  Scenario: Record service creation

    When an administrator creates a service
    Then an audit event should be created
    And the event should identify the administrator
    And the event should identify the created service

  Scenario: Record API key revocation

    When an administrator revokes an API key
    Then an audit event should be created

  Scenario: Record threat status changes

    Given an open threat exists
    When an administrator resolves the threat
    Then an audit event should record the status change

  Scenario: Do not store sensitive credentials

    When an API key action is recorded
    Then the audit event should not contain the API key value
