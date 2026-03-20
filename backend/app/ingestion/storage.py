import hashlib
import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)


class FileStorage:
    """Local filesystem storage for uploaded documents.

    Files are stored at: {base_dir}/{user_id}/{document_id}/{filename}
    """

    def __init__(self, base_dir: str) -> None:
        self._base_dir = Path(base_dir)
        self._base_dir.mkdir(parents=True, exist_ok=True)

    async def save(
        self, user_id: str, document_id: str, filename: str, content: bytes
    ) -> Path:
        dest_dir = self._base_dir / user_id / document_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / filename
        dest.write_bytes(content)
        logger.info("Saved file %s (%d bytes)", dest, len(content))
        return dest

    async def load(self, user_id: str, document_id: str, filename: str) -> bytes:
        path = self._base_dir / user_id / document_id / filename
        return path.read_bytes()

    async def delete(self, user_id: str, document_id: str) -> None:
        path = self._base_dir / user_id / document_id
        if path.exists():
            shutil.rmtree(path)
            logger.info("Deleted document files at %s", path)

    @staticmethod
    def compute_hash(content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()
