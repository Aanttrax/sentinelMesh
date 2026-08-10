Feature: Service Registration

  As a platform operator
  I want to register external API services in SentinelMesh
  So that their HTTP events can be monitored

  Scenario: Register a new service
    Given a valid service configuration
    When I register the service
    Then the service is stored and ready to accept events
