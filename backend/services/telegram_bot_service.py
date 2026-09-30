"""
SentinelPay - Telegram Bot Service
Provides out-of-band interactive fraud challenge handling:
- Long-polling listener for inline button callbacks ([ 🛑 Deny & Freeze ] / [ ✅ Authorize ])
- Direct text reply processing ("No", "Deny", "Yes", "Approve")
- Automatic state machine mutation from SOFT_BLOCKED to BLOCKED or RELEASED
- Real-time WebSocket event broadcast to update Web Simulator and Analyst Portal
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import httpx
from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal
from backend.database.models import Transaction

logger = logging.getLogger("sentinelpay.telegram_bot")

class TelegramBotService:
    _instance: Optional["TelegramBotService"] = None

    def __init__(self):
        self.bot_token = (os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
        self.default_chat_id = (os.getenv("TELEGRAM_CHAT_ID") or "").strip()
        self._polling_task: Optional[asyncio.Task] = None
        self._is_running = False
        self._offset = 0

    @classmethod
    def get_instance(cls) -> "TelegramBotService":
        if cls._instance is None:
            cls._instance = TelegramBotService()
        return cls._instance

    def start_polling(self) -> Optional[asyncio.Task]:
        """
        Starts the background long-polling loop if TELEGRAM_BOT_TOKEN is present.
        """
        if not self.bot_token:
            logger.info("[TELEGRAM_BOT] TELEGRAM_BOT_TOKEN not set; skipping Telegram polling listener.")
            return None

        if self._is_running:
            return self._polling_task

        self._is_running = True
        self._polling_task = asyncio.create_task(self._polling_loop(), name="sentinelpay-telegram-poller")
        logger.info("[TELEGRAM_BOT] Real-time Telegram polling service started successfully.")
        return self._polling_task

    async def stop_polling(self):
        """
        Stops the polling loop cleanly on backend shutdown.
        """
        self._is_running = False
        if self._polling_task and not self._polling_task.done():
            self._polling_task.cancel()
            try:
                await self._polling_task
            except asyncio.CancelledError:
                pass
        logger.info("[TELEGRAM_BOT] Telegram polling service stopped.")

    async def _polling_loop(self):
        """
        Long-polling loop fetching updates from Telegram Bot API getUpdates.
        """
        logger.info("[TELEGRAM_BOT] Polling loop running for @sentinelpay_guard_bot...")
        while self._is_running:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    url = f"https://api.telegram.org/bot{self.bot_token}/getUpdates"
                    params = {
                        "offset": self._offset,
                        "timeout": 8,
                        "allowed_updates": ["message", "callback_query"]
                    }
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        updates = data.get("result", [])
                        for update in updates:
                            self._offset = max(self._offset, update["update_id"] + 1)
                            db: Session = SessionLocal()
                            try:
                                await self.handle_update(update, db)
                            except Exception as ex:
                                logger.error(f"[TELEGRAM_BOT] Error handling update {update.get('update_id')}: {ex}")
                            finally:
                                db.close()
                    elif resp.status_code == 409:
                        # Webhook conflict or another getUpdates instance
                        logger.warning("[TELEGRAM_BOT] Conflict on getUpdates (another instance or webhook active). Retrying in 5s...")
                        await asyncio.sleep(5)
                    else:
                        logger.warning(f"[TELEGRAM_BOT] getUpdates responded with HTTP {resp.status_code}")
                        await asyncio.sleep(3)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"[TELEGRAM_BOT] Connection glitch in Telegram polling: {e}. Retrying in 3s...")
                await asyncio.sleep(3)

    async def handle_update(self, update: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Dispatches incoming Telegram updates (Inline Buttons & Text Replies).
        """
        # 1. Handle Inline Button Clicks (callback_query)
        if "callback_query" in update:
            return await self._handle_callback_query(update["callback_query"], db)

        # 2. Handle Text Messages (/start, "no", "deny", "yes", "approve")
        if "message" in update:
            return await self._handle_message(update["message"], db)

        return {"status": "IGNORED"}

    async def _handle_callback_query(self, cb: Dict[str, Any], db: Session) -> Dict[str, Any]:
        from backend.api.gateway import resolve_transaction_verification

        cb_id = cb.get("id")
        cb_data = cb.get("data", "")
        msg = cb.get("message", {})
        chat_id = msg.get("chat", {}).get("id")
        msg_id = msg.get("message_id")

        if not cb_data or ":" not in cb_data:
            return {"status": "INVALID_CALLBACK"}

        action, token = cb_data.split(":", 1)
        action = action.upper()

        logger.info(f"[TELEGRAM_BOT] User action '{action}' for transaction '{token}' from chat {chat_id}")

        res = await resolve_transaction_verification(
            db=db,
            transaction_token=token,
            action=action,
            auth_method="TELEGRAM_INLINE_CHALLENGE",
            reason=f"Cardholder tapped '{action}' via Telegram Bot inline button.",
            client_ip="telegram-bot-api"
        )

        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
        amt_str = f"${res.get('amount', 0.0):,.2f} {res.get('currency', 'USD')}"

        if action in ["DENY", "BLOCK"]:
            cb_alert = "🛑 Transaction BLOCKED! Your card is secured."
            edit_text = (
                f"🚨 *SentinelPay Bank Risk Advisory*\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"🛑 *STATUS: BLOCKED BY CARDHOLDER*\n"
                f"🔖 *Token:* `{token}`\n"
                f"💰 *Amount:* {amt_str}\n"
                f"🔒 *Action:* Transaction terminated & card frozen.\n"
                f"🛡️ *Security:* Cardholder confirmed fraudulent charge.\n"
                f"🕒 *Timestamp:* {now_str}\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"✅ *Cardholder funds are 100% safe ($0.00 debited).*"
            )
        else:
            cb_alert = "✅ Transaction APPROVED! Payment released."
            edit_text = (
                f"🚨 *SentinelPay Bank Risk Advisory*\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"✅ *STATUS: RELEASED & AUTHORIZED*\n"
                f"🔖 *Token:* `{token}`\n"
                f"💰 *Amount:* {amt_str}\n"
                f"⚡ *Action:* Payment approved by cardholder.\n"
                f"🏦 *Settlement:* Transferred to merchant via Bakong KHQR.\n"
                f"🕒 *Timestamp:* {now_str}\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"✓ *Receipt generated in mobile banking app.*"
            )

        # 1. Answer Telegram Callback Query (hides loading spinner on user's phone)
        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                await client.post(
                    f"https://api.telegram.org/bot{self.bot_token}/answerCallbackQuery",
                    json={"callback_query_id": cb_id, "text": cb_alert, "show_alert": True}
                )
            except Exception as e:
                logger.warning(f"[TELEGRAM_BOT] Failed to answer callback query: {e}")

            # 2. Edit Telegram message to update status and remove inline buttons
            if chat_id and msg_id:
                try:
                    await client.post(
                        f"https://api.telegram.org/bot{self.bot_token}/editMessageText",
                        json={
                            "chat_id": chat_id,
                            "message_id": msg_id,
                            "text": edit_text,
                            "parse_mode": "Markdown",
                            "reply_markup": {"inline_keyboard": []}  # removes buttons
                        }
                    )
                except Exception as e:
                    logger.warning(f"[TELEGRAM_BOT] Failed to edit message text: {e}")

        return {"status": "SUCCESS", "decision": action, "token": token}

    async def _handle_message(self, msg: Dict[str, Any], db: Session) -> Dict[str, Any]:
        from backend.api.gateway import resolve_transaction_verification

        chat_id = msg.get("chat", {}).get("id")
        text = (msg.get("text") or "").strip().lower()

        if not chat_id or not text:
            return {"status": "EMPTY_MESSAGE"}

        # 1. Deny / Fraud Commands
        if text in ["no", "deny", "block", "fraud", "stop", "cancel", "not me"]:
            pending_tx = (
                db.query(Transaction)
                .filter(Transaction.status == "SOFT_BLOCKED")
                .order_by(Transaction.created_at.desc())
                .first()
            )
            if pending_tx:
                res = await resolve_transaction_verification(
                    db=db,
                    transaction_token=pending_tx.transaction_token,
                    action="DENY",
                    auth_method="TELEGRAM_TEXT_REPLY",
                    reason="Cardholder texted denial keyword via Telegram.",
                    client_ip="telegram-bot-api"
                )
                reply = (
                    f"🛑 *Transaction BLOCKED by Cardholder*\n"
                    f"━━━━━━━━━━━━━━━━━━━\n"
                    f"🔖 *Token:* `{pending_tx.transaction_token}`\n"
                    f"💰 *Amount:* ${pending_tx.amount:,.2f} {pending_tx.currency}\n"
                    f"🔒 *Action:* Transaction terminated & card frozen.\n"
                    f"🛡️ *Security Status:* Confirmed Fraud (`label=1`).\n"
                    f"✅ *Your account balance is protected ($0.00 debited).*"
                )
            else:
                reply = "ℹ️ *No pending transactions* are currently awaiting step-up verification."

            await self._send_telegram_message(chat_id, reply)
            return {"status": "PROCESSED_DENIAL"}

        # 2. Approve Commands
        if text in ["yes", "approve", "ok", "release", "allow", "confirm"]:
            pending_tx = (
                db.query(Transaction)
                .filter(Transaction.status == "SOFT_BLOCKED")
                .order_by(Transaction.created_at.desc())
                .first()
            )
            if pending_tx:
                res = await resolve_transaction_verification(
                    db=db,
                    transaction_token=pending_tx.transaction_token,
                    action="APPROVE",
                    auth_method="TELEGRAM_TEXT_REPLY",
                    reason="Cardholder texted approval keyword via Telegram.",
                    client_ip="telegram-bot-api"
                )
                reply = (
                    f"✅ *Transaction APPROVED by Cardholder*\n"
                    f"━━━━━━━━━━━━━━━━━━━\n"
                    f"🔖 *Token:* `{pending_tx.transaction_token}`\n"
                    f"💰 *Amount:* ${pending_tx.amount:,.2f} {pending_tx.currency}\n"
                    f"⚡ *Status:* RELEASED for settlement via Bakong KHQR.\n"
                    f"✓ *Receipt generated in mobile banking app.*"
                )
            else:
                reply = "ℹ️ *No pending transactions* are currently awaiting step-up verification."

            await self._send_telegram_message(chat_id, reply)
            return {"status": "PROCESSED_APPROVAL"}

        # 3. Welcome / Info Commands
        if text in ["/start", "/help", "hi", "hello"]:
            reply = (
                "👋 *SentinelPay Security Guard Online*\n"
                "━━━━━━━━━━━━━━━━━━━\n"
                "I deliver real-time risk advisories for suspicious payments across your connected bank accounts.\n\n"
                "• When a high-risk payment is intercepted, an alert will appear with **[ 🛑 Deny & Freeze Card ]** and **[ ✅ Authorize Payment ]** buttons.\n"
                "• You can also reply directly with **\"No\"** to deny or **\"Yes\"** to authorize any active pending challenge.\n\n"
                "_SentinelPay Multi-Tenant AI Fraud Intelligence Platform._"
            )
            await self._send_telegram_message(chat_id, reply)
            return {"status": "SENT_GREETING"}

        return {"status": "UNKNOWN_COMMAND"}

    async def _send_telegram_message(self, chat_id: int, text: str):
        if not self.bot_token:
            return
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown"
        }
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(url, json=payload)
        except Exception as e:
            logger.warning(f"[TELEGRAM_BOT] Failed to send message to {chat_id}: {e}")
