Feature: Dashboard

  As a platform operator
  I want a web dashboard to visualize threats and alerts
  So that I can monitor the security posture of my APIs

  Scenario: View active threats
    Given one or more scored threats exist
    When I open the dashboard
    Then I see a list of active threats with their scores and details
