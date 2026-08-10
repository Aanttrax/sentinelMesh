Feature: Webhook alerting

  As a security administrator
  I want SentinelMesh to send webhook notifications
  So that external systems can react to threats

  Scenario: Configure a webhook

    Given an administrator owns a service
    When the administrator configures a webhook
    Then the webhook should be stored securely

  Scenario: Send a critical threat webhook

    Given a configured webhook exists
    When a critical threat is detected
    Then SentinelMesh should send a webhook notification

  Scenario: Retry a failed webhook

    Given a webhook delivery fails
    When the retry policy is triggered
    Then SentinelMesh should retry the webhook delivery

  Scenario: Disable a webhook

    Given an active webhook exists
    When an administrator disables the webhook
    Then future alerts should not be delivered to that webhook
