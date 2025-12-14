from cryptography.fernet import Fernet
import os
import base64

class EncryptionManager:
    def __init__(self, key: bytes = None, previous_key: bytes = None):
        if key:
            self.key = key
        else:
            # In production, load this from a secure secret manager (AWS KMS, Vault, etc.)
            # For this implementation, we'll use an env var or generate one
            env_key = os.getenv("ENCRYPTION_KEY")
            if env_key:
                self.key = env_key.encode()
            else:
                # Fallback for dev/demo - DO NOT USE IN PRODUCTION WITHOUT PERSISTENCE
                self.key = Fernet.generate_key()
        
        self.cipher_suite = Fernet(self.key)
        self.previous_cipher_suite = Fernet(previous_key) if previous_key else None

    def encrypt(self, data: str) -> str:
        """
        Encrypts a string and returns the encrypted token as a string.
        """
        if not data:
            return None
        encrypted_bytes = self.cipher_suite.encrypt(data.encode())
        return encrypted_bytes.decode()

    def decrypt(self, token: str) -> str:
        """
        Decrypts a token string and returns the original string.
        Try current key first, then previous key if available.
        """
        if not token:
            return None
        
        try:
            decrypted_bytes = self.cipher_suite.decrypt(token.encode())
            return decrypted_bytes.decode()
        except Exception:
            if self.previous_cipher_suite:
                try:
                    decrypted_bytes = self.previous_cipher_suite.decrypt(token.encode())
                    return decrypted_bytes.decode()
                except Exception:
                    pass
            raise ValueError("Invalid token or key")

    def re_encrypt(self, token: str) -> str:
        """
        Decrypts with whatever key works (current or previous) and re-encrypts with current key.
        Useful for data migration during key rotation.
        """
        if not token:
            return None
        
        decrypted_data = self.decrypt(token)
        return self.encrypt(decrypted_data)

# Global instance
encryption_manager = EncryptionManager()
