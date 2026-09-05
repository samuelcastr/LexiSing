import firebase_admin
from firebase_admin import auth as firebase_auth
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class FirebaseAuthentication(TokenAuthentication):
    """
    Autenticación basada en Firebase ID tokens.
    Valida el token enviado en el header 'Authorization: Bearer <ID_TOKEN>'
    """
    keyword = 'Bearer'

    def authenticate_credentials(self, key):
        try:
            decoded_token = firebase_auth.verify_id_token(key)
            uid = decoded_token.get('uid')
            if not uid:
                raise AuthenticationFailed('Token inválido: no contiene uid')
            return (uid, decoded_token)  # retorna (uid, decoded_token)
        except firebase_auth.InvalidIdTokenError:
            raise AuthenticationFailed('Token Firebase inválido')
        except firebase_auth.ExpiredIdTokenError:
            raise AuthenticationFailed('Token Firebase expirado')
        except Exception as e:
            raise AuthenticationFailed(f'Error validando token: {str(e)}')
