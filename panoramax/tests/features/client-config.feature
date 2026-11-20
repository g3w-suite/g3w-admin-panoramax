@backend
Feature: Panoramax client configuration

  Scenario: The project configuration enables the Panoramax control
    When the Panoramax project configuration is created
    Then it identifies the project and plugin version
