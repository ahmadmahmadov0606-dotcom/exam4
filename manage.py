#!/usr/bin/env python
import os
import sys


def use_project_venv():
    # `python manage.py …` with the system Python: rerun it with the project's .venv, where Django is.
    venv_python = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.venv', 'bin', 'python')
    if sys.prefix == sys.base_prefix and os.path.exists(venv_python):
        os.execv(venv_python, [venv_python, *sys.argv])


def main():
    use_project_venv()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
