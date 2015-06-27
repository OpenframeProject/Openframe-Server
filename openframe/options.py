"""All the application options are defined here.

If you need to inject options at runtime (for testing, etc...):

    from dokomoforms.options import parse_options

    parse_options(name1=value1, name2=value2, ...)
"""

from tornado.options import define, options

__all__ = ('options',)
_arg = None

# Application options
define('port', default=8888, help='run on the given port', type=int)
define('debug', default=False, help='whether to enable debug mode', type=bool)
