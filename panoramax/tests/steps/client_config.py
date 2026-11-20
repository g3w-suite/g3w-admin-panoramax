from behave import then, when

from panoramax import __version__
from panoramax.receivers import set_initconfig_value


@when('the Panoramax project configuration is created')
def create_project_config(context):
    context.plugin_config = set_initconfig_value(
        sender=None, projectType='qdjango', project=42,
    )


@then('it identifies the project and plugin version')
def check_project_config(context):
    assert context.plugin_config == {
        'panoramax': {'version': __version__, 'gid': 'qdjango:42'},
    }
