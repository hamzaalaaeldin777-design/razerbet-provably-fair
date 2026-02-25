#!/usr/bin/env python3
"""
RazerBet Provably Fair API Testing Suite
Tests all backend endpoints for the verification website
"""

import requests
import sys
import json
from datetime import datetime

class RazerBetAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.bot_api_key = "razerbet_api_key_change_this_in_production"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_get_games(self):
        """Test get supported games endpoint"""
        try:
            response = requests.get(f"{self.api_url}/games", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                games = data.get('games', [])
                expected_games = ["blackjack", "tower", "dices_war", "mines", "coinflip", "match", "crash"]
                success = len(games) == 7 and all(game in expected_games for game in games)
                details += f", Games count: {len(games)}"
            self.log_test("Get Games", success, details)
            return success
        except Exception as e:
            self.log_test("Get Games", False, str(e))
            return False

    def test_verify_endpoint(self):
        """Test verification endpoint with sample data"""
        try:
            # Test data for coinflip
            test_data = {
                "server_seed": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
                "client_seed": "user_seed_123",
                "nonce": 0,
                "game_type": "coinflip"
            }
            
            response = requests.post(
                f"{self.api_url}/verify",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['is_valid', 'server_seed_hash', 'result', 'raw_result', 'game_type', 'calculation_steps']
                has_all_fields = all(field in data for field in required_fields)
                success = has_all_fields and data['is_valid'] == True
                details += f", Valid: {data.get('is_valid')}, Game: {data.get('game_type')}"
            
            self.log_test("Verify Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Verify Endpoint", False, str(e))
            return False

    def test_verify_invalid_game(self):
        """Test verification with invalid game type"""
        try:
            test_data = {
                "server_seed": "test_seed",
                "client_seed": "user_seed",
                "nonce": 0,
                "game_type": "invalid_game"
            }
            
            response = requests.post(
                f"{self.api_url}/verify",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 400
            details = f"Status: {response.status_code}"
            
            self.log_test("Verify Invalid Game", success, details)
            return success
        except Exception as e:
            self.log_test("Verify Invalid Game", False, str(e))
            return False

    def test_history_endpoint(self):
        """Test game history endpoint"""
        try:
            response = requests.get(f"{self.api_url}/history", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                has_games_field = 'games' in data and 'count' in data
                success = has_games_field
                details += f", Games field present: {has_games_field}, Count: {data.get('count', 0)}"
            
            self.log_test("History Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("History Endpoint", False, str(e))
            return False

    def test_history_with_filter(self):
        """Test game history with game type filter"""
        try:
            response = requests.get(f"{self.api_url}/history?game_type=coinflip&limit=10", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                success = 'games' in data
                details += f", Filtered games count: {len(data.get('games', []))}"
            
            self.log_test("History with Filter", success, details)
            return success
        except Exception as e:
            self.log_test("History with Filter", False, str(e))
            return False

    def test_stats_endpoint(self):
        """Test statistics endpoint"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['total_games', 'total_verified', 'games_by_type', 'recent_games_count']
                has_all_fields = all(field in data for field in required_fields)
                success = has_all_fields
                details += f", Total games: {data.get('total_games', 0)}"
            
            self.log_test("Stats Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Stats Endpoint", False, str(e))
            return False

    def test_bot_game_endpoint(self):
        """Test bot game recording endpoint (requires API key)"""
        try:
            # Test game data
            game_data = {
                "game_type": "coinflip",
                "server_seed": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
                "client_seed": "test_client_seed",
                "nonce": 0,
                "user_id": "test_user_123",
                "username": "TestUser",
                "bet_amount": 0.01,
                "multiplier": 2.0,
                "won": True,
                "payout": 0.02,
                "currency": "ETH"
            }
            
            headers = {
                'Content-Type': 'application/json',
                'X-API-KEY': self.bot_api_key
            }
            
            response = requests.post(
                f"{self.api_url}/bot/game",
                json=game_data,
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                success = data.get('success') == True and 'game_id' in data
                details += f", Success: {data.get('success')}, Game ID present: {'game_id' in data}"
            
            self.log_test("Bot Game Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Bot Game Endpoint", False, str(e))
            return False

    def test_bot_game_invalid_key(self):
        """Test bot game endpoint with invalid API key"""
        try:
            game_data = {
                "game_type": "coinflip",
                "server_seed": "test_seed",
                "client_seed": "test_client",
                "nonce": 0,
                "user_id": "test_user",
                "username": "TestUser",
                "bet_amount": 0.01,
                "multiplier": 2.0,
                "won": True,
                "payout": 0.02
            }
            
            headers = {
                'Content-Type': 'application/json',
                'X-API-KEY': 'invalid_key'
            }
            
            response = requests.post(
                f"{self.api_url}/bot/game",
                json=game_data,
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 401
            details = f"Status: {response.status_code}"
            
            self.log_test("Bot Game Invalid Key", success, details)
            return success
        except Exception as e:
            self.log_test("Bot Game Invalid Key", False, str(e))
            return False

    def test_seed_generation(self):
        """Test seed pair generation"""
        try:
            response = requests.post(
                f"{self.api_url}/seeds/generate",
                json={"client_seed": "test_client_seed"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['id', 'server_seed_hash', 'client_seed', 'nonce']
                has_all_fields = all(field in data for field in required_fields)
                success = has_all_fields
                details += f", Has all fields: {has_all_fields}"
            
            self.log_test("Seed Generation", success, details)
            return success
        except Exception as e:
            self.log_test("Seed Generation", False, str(e))
            return False

    def test_hash_verification(self):
        """Test hash verification endpoint"""
        try:
            # Use known server seed and its hash
            server_seed = "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
            # Calculate expected hash (SHA256 of the seed)
            import hashlib
            expected_hash = hashlib.sha256(server_seed.encode()).hexdigest()
            
            response = requests.post(
                f"{self.api_url}/verify-hash?server_seed={server_seed}&expected_hash={expected_hash}",
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                success = data.get('matches') == True
                details += f", Hash matches: {data.get('matches')}"
            
            self.log_test("Hash Verification", success, details)
            return success
        except Exception as e:
            self.log_test("Hash Verification", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting RazerBet API Tests...")
        print(f"📡 Testing API: {self.api_url}")
        print("=" * 50)
        
        # Basic API tests
        self.test_api_root()
        self.test_get_games()
        
        # Verification tests
        self.test_verify_endpoint()
        self.test_verify_invalid_game()
        
        # History and stats
        self.test_history_endpoint()
        self.test_history_with_filter()
        self.test_stats_endpoint()
        
        # Bot API tests
        self.test_bot_game_endpoint()
        self.test_bot_game_invalid_key()
        
        # Seed management
        self.test_seed_generation()
        self.test_hash_verification()
        
        # Print summary
        print("=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = RazerBetAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())