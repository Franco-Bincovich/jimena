from datetime import timezone

from google.oauth2.credentials import Credentials as _BaseCredentials


def _to_aware(dt):
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class PatchedCredentials(_BaseCredentials):
    """
    Subclase de Credentials que garantiza que expiry siempre sea timezone-aware.
    La librería google-auth llama credentials.valid (que compara expiry con utcnow())
    en cada .execute(). Si expiry es naive y utcnow() es aware (o viceversa) lanza
    TypeError. Esta subclase normaliza el valor en getter y setter para que nunca ocurra.
    """

    @property
    def expiry(self):
        return _to_aware(super().expiry)

    @expiry.setter
    def expiry(self, value):
        _BaseCredentials.expiry.fset(self, _to_aware(value))
