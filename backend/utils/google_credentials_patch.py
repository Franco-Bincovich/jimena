from datetime import timezone
from google.oauth2.credentials import Credentials


def _to_aware(dt):
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class PatchedCredentials(Credentials):
    @property
    def expiry(self):
        exp = self.__dict__.get("_expiry")
        return _to_aware(exp)

    @expiry.setter
    def expiry(self, value):
        self.__dict__["_expiry"] = _to_aware(value)
