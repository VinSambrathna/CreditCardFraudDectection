"""
SentinelPay - External Notification & Webhook Service
Dispatches live out-of-band security alerts and Step-Up OTP challenges to external services
(Telegram Bot API / Webhooks) when high-risk transactions are intercepted.
Includes graceful fallback if external messaging API is unconfigured or unreachable.
"""

import os
import logging
from typing import Dict, Any, Optional, List
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("sentinelpay.external_notif")

class ExternalNotificationService:
    _instance = None

    def __init__(self):
        load_dotenv()
        self.telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def send_step_up_alert(
        self,
        transaction_token: str,
        institution_code: str,
        amount: float,
        currency: str,
        risk_level: str,
        fraud_probability: float,
        top_explanations: List[Dict[str, Any]],
        otp_code: Optional[str] = "849201",
        geo_telemetry: Optional[Dict[str, Any]] = None,
        distance_km: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Dispatches real-time risk alert and Step-Up OTP challenge via Telegram Bot API.
        Formats exact measured values (distance in km, device trust %, amount) and SHAP impact.
        """
        top_signal_label = "🔍 *Top Risk Driver*"
        top_factor = "Geographic anomaly"

        if top_explanations and len(top_explanations) > 0:
            item = top_explanations[0]
            feat = item.get("feature", "")
            lbl = item.get("label", "Signal")
            val = item.get("value")
            contrib = item.get("contribution", 0.0)

            if contrib < 0:
                top_signal_label = "🛡️ *Key Mitigating Signal*"

            if feat == "distance":
                top_factor = f"{lbl}: *{val:,.1f} km* (SHAP: `{contrib:+0.2f}`)"
            elif feat == "device_trust":
                top_factor = f"{lbl}: *{val * 100:.0f}% confidence* (SHAP: `{contrib:+0.2f}`)"
            elif feat == "amount":
                top_factor = f"{lbl}: *${val:,.2f}* (SHAP: `{contrib:+0.2f}`)"
            elif feat == "merchant_risk":
                top_factor = f"{lbl}: *{val * 100:.0f}% category index* (SHAP: `{contrib:+0.2f}`)"
            elif feat == "velocity_1h":
                top_factor = f"{lbl}: *{int(val)} txs/hr* (SHAP: `{contrib:+0.2f}`)"
            else:
                top_factor = f"{lbl}: *{val}* (SHAP: `{contrib:+0.2f}`)"

        # Location Telemetry Line (Explaining detected location vs registered home)
        location_line = ""
        home_city = "Phnom Penh, Cambodia"
        if geo_telemetry and geo_telemetry.get("city") and not geo_telemetry.get("is_fallback"):
            city = geo_telemetry.get("city")
            country = geo_telemetry.get("country")
            km = geo_telemetry.get("distance_km", distance_km or 0.0)
            location_line = (
                f"📍 *Transaction Origin:* {city}, {country}\n"
                f"🏠 *Cardholder Home Base:* {home_city} (*{km:,.1f} km* away)\n"
            )
        elif distance_km is not None and distance_km > 5.0:
            location_line = f"🏠 *Cardholder Home Base:* {home_city} (*{distance_km:,.1f} km* away)\n"

        # 1. Format clean Markdown alert
        message = (
            f"🚨 *SentinelPay Bank Risk Advisory*\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"🏦 *Institution:* {institution_code}\n"
            f"🔖 *Token:* `{transaction_token}`\n"
            f"💰 *Amount:* {currency} {amount:,.2f}\n"
            f"⚠️ *Assessed Risk:* *{risk_level}* ({fraud_probability * 100:.1f}%)\n"
            f"{location_line}"
            f"{top_signal_label}: {top_factor}\n\n"
            f"🔐 *Step-Up OTP Challenge:* `{otp_code}`\n"
            f"_Acknowledge or challenge this payment in mobile banking app._"
        )

        bot_token = (os.getenv("TELEGRAM_BOT_TOKEN") or self.telegram_bot_token or "").strip()
        chat_id = (os.getenv("TELEGRAM_CHAT_ID") or self.telegram_chat_id or "").strip()

        # 2. Check if live Telegram credentials exist
        if bot_token and chat_id:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "Markdown",
                "reply_markup": {
                    "inline_keyboard": [
                        [
                            {
                                "text": "🛑 Deny & Freeze Card",
                                "callback_data": f"DENY:{transaction_token}"
                            },
                            {
                                "text": "✅ Authorize Payment",
                                "callback_data": f"APPROVE:{transaction_token}"
                            }
                        ]
                    ]
                }
            }
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        logger.info(f"[EXTERNAL_NOTIF] Successfully dispatched Telegram alert for {transaction_token}.")
                        return {
                            "status": "DELIVERED",
                            "provider": "TELEGRAM_BOT_API",
                            "chat_id": self.telegram_chat_id,
                            "is_fallback": False
                        }
                    else:
                        logger.warning(f"[EXTERNAL_NOTIF] Telegram API responded with {res.status_code}: {res.text}")
            except Exception as e:
                logger.warning(f"[EXTERNAL_NOTIF] Telegram dispatch exception: {e}")

        # 3. Graceful fallback (logged out-of-band dispatch)
        logger.info(f"[EXTERNAL_NOTIF] [FALLBACK_DISPATCH] OTP {otp_code} for {transaction_token} routed to customer mobile push.")
        return {
            "status": "SIMULATED_DISPATCH",
            "provider": "INTERNAL_MOCK_CHANNEL",
            "otp_code": otp_code,
            "message": "Live Telegram Bot not configured in .env (TELEGRAM_BOT_TOKEN missing); simulated dispatch logged.",
            "is_fallback": True
        }
