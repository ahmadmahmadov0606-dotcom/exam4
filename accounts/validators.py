from django.core.exceptions import ValidationError


class MinimumLengthValidator:
    """The only password rule: at least `min_length` characters (digits-only passwords are fine)."""

    def __init__(self, min_length=6):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(f'Парол бояд ақаллан {self.min_length} аломат бошад.', code='password_too_short')

    def get_help_text(self):
        return f'Ақаллан {self.min_length} аломат.'
