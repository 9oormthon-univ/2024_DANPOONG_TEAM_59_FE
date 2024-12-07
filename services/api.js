import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.61.45:8080/api';

class ApiService {
    static async getAuthHeaders() {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
            throw new Error('인증이 필요합니다.');
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    // 닉네임 업데이트
    static async updateNickname(nickname) {
        try {
            const headers = await this.getAuthHeaders();
            console.log('Updating nickname with:', nickname); // 요청 데이터 로깅
            const response = await fetch(`${BASE_URL}/member/nickname`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ nickname })
            });

            console.log('Response status:', response.status); // 응답 상태 로깅

            if (!response.ok) {
                const errorData = await response.json();
                console.log('Error response:', errorData); // 에러 응답 로깅
                throw new Error(errorData.message || '닉네임 업데이트 실패');
            }

            const result = await response.json();
            console.log('Success response:', result); // 성공 응답 로깅
            return result;
        } catch (error) {
            console.error('Nickname update error:', error); // 에러 로깅
            throw error;
        }
    }

    // 위치 정보 업데이트
    static async updateLocation(locationData) {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${BASE_URL}/member/location`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    province: locationData.province,
                    city: locationData.city,
                    district: locationData.district
                })
            });

            if (!response.ok) {
                throw new Error('위치 정보 업데이트 실패');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // 좋아요한 게시글 목록 조회
    static async getLikedPosts() {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${BASE_URL}/member/likes`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error('좋아요 게시글 조회 실패');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // 내가 작성한 게시글 목록 조회
    static async getMyPosts() {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${BASE_URL}/member/posts`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error('내 게시글 조회 실패');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // 돌봄 내역 조회
    static async getCareHistory() {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${BASE_URL}/member/care-posts`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error('돌봄 내역 조회 실패');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // 회원 탈퇴
    static async withdrawMember() {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${BASE_URL}/member`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                throw new Error('회원 탈퇴 실패');
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    // 포인트 조회
    static async getPoints() {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${BASE_URL}/member/points`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error('포인트 조회 실패');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}

export default ApiService;