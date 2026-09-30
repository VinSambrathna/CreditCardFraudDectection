"""
SentinelPay - External IP Geolocation Integration Service
Connects to external Geolocation APIs (ip-api.com) to resolve real client IP addresses,
extract geographical coordinates, and compute exact Haversine distance from cardholder baseline.
Includes strict timeouts and graceful fallback when external network is unavailable.
"""

import math
import logging
from typing import Dict, Any, Optional, Tuple
import httpx

logger = logging.getLogger("sentinelpay.external_geo")

# Default Home Centroid: Phnom Penh, Cambodia (BKK1 / Central)
DEFAULT_HOME_LAT = 11.5564
DEFAULT_HOME_LON = 104.9282

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two latitude/longitude points on Earth
    using the spherical Haversine formula.
    """
    R = 6371.0  # Earth's mean radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 2)

class ExternalGeoService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def resolve_ip_distance(
        self,
        ip_address: Optional[str],
        home_lat: float = DEFAULT_HOME_LAT,
        home_lon: float = DEFAULT_HOME_LON
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Queries live external IP Geolocation API (ip-api.com) with a strict 2.0s timeout.
        Returns: (computed_distance_km, geo_telemetry_dict)
        """
        if not ip_address or ip_address in ["127.0.0.1", "localhost", "::1", "testclient"]:
            return 2.5, {
                "source": "LOCAL_LOOPBACK",
                "ip": ip_address or "127.0.0.1",
                "city": "Phnom Penh (Simulated Local)",
                "country": "Cambodia",
                "distance_km": 2.5,
                "is_fallback": True
            }

        url = f"http://ip-api.com/json/{ip_address}?fields=status,message,country,countryCode,city,lat,lon,proxy,query"

        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "success":
                        remote_lat = float(data.get("lat", home_lat))
                        remote_lon = float(data.get("lon", home_lon))
                        dist_km = haversine_distance_km(home_lat, home_lon, remote_lat, remote_lon)

                        telemetry = {
                            "source": "LIVE_EXTERNAL_API (ip-api.com)",
                            "ip": data.get("query", ip_address),
                            "country": data.get("country", "Unknown"),
                            "city": data.get("city", "Unknown"),
                            "remote_coords": {"lat": remote_lat, "lon": remote_lon},
                            "home_coords": {"lat": home_lat, "lon": home_lon},
                            "distance_km": dist_km,
                            "proxy_or_vpn": data.get("proxy", False),
                            "is_fallback": False
                        }
                        logger.info(f"[EXTERNAL_GEO] Resolved IP {ip_address} -> {data.get('city')}, {data.get('country')} ({dist_km} km)")
                        return dist_km, telemetry

            # If response not success, gracefully fall back
            logger.warning(f"[EXTERNAL_GEO] Non-success response for IP {ip_address}.")
            return 2.5, {
                "source": "EXTERNAL_API_UNAVAILABLE",
                "ip": ip_address,
                "distance_km": 2.5,
                "is_fallback": True
            }

        except Exception as e:
            logger.warning(f"[EXTERNAL_GEO] Failed to reach external geo API: {e}. Graceful fallback applied.")
            return 2.5, {
                "source": "EXTERNAL_API_TIMEOUT_FALLBACK",
                "ip": ip_address,
                "distance_km": 2.5,
                "error": str(e),
                "is_fallback": True
            }
