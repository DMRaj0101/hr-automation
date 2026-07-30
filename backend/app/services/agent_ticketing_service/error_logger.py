import logging
import os
from datetime import datetime


class ErrorLogger:
    """Single-responsibility logging module — writes to both console and a daily log file."""

    def __init__(self, log_dir: str = "logs"):
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, f"agent_monitor_{datetime.now().strftime('%Y%m%d')}.log")

        self._logger = logging.getLogger("AgentMonitor")
        self._logger.setLevel(logging.INFO)

        if not self._logger.handlers:
            file_handler = logging.FileHandler(log_file)
            console_handler = logging.StreamHandler()
            formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
            file_handler.setFormatter(formatter)
            console_handler.setFormatter(formatter)
            self._logger.addHandler(file_handler)
            self._logger.addHandler(console_handler)

    def info(self, message: str):
        self._logger.info(message)

    def error(self, message: str):
        self._logger.error(message)

    def warning(self, message: str):
        self._logger.warning(message)