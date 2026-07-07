import unittest

from market_data_sources import parse_index_totals, parse_limit_pool


class MarketDataSourceTests(unittest.TestCase):
    def test_parse_index_totals_uses_eastmoney_f47_and_f48(self):
        totals = parse_index_totals([
            {
                "data": {
                    "f57": "000001",
                    "f58": "SH",
                    "f47": 514453091,
                    "f48": 1196371087894.4,
                }
            },
            {
                "data": {
                    "f57": "399001",
                    "f58": "SZ",
                    "f47": 678476454,
                    "f48": 1384786224621.8315,
                }
            },
        ])

        self.assertEqual(totals["volume"], 1192929545)
        self.assertAlmostEqual(totals["amount"], 2581157312516.2314)

    def test_parse_limit_pool_counts_rows_and_max_limit_days(self):
        parsed = parse_limit_pool({
            "data": {
                "tc": 2,
                "pool": [
                    {
                        "c": "000001",
                        "n": "A",
                        "zdp": 10.0,
                        "p": 12000,
                        "amount": 100,
                        "lbc": 1,
                        "hybk": "bank",
                    },
                    {
                        "c": "000002",
                        "n": "B",
                        "zdp": 10.0,
                        "p": 15000,
                        "amount": 200,
                        "lbc": 6,
                        "hybk": "real estate",
                    },
                ],
            }
        }, limit_day_field="lbc")

        self.assertEqual(parsed["count"], 2)
        self.assertEqual(parsed["max_limit_days"], 6)
        self.assertEqual(parsed["stocks"][0]["price"], 12.0)


if __name__ == "__main__":
    unittest.main()
