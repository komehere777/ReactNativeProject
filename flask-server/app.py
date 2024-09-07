from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from model import get_user_chat_historys, get_user_chat, delete_chat, add_chat, update_chat, create_user, authenticate_user, get_user_data, delete_user
from utils import get_ai_response
from config import SECRET_KEY

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['JWT_SECRET_KEY'] = SECRET_KEY
jwt = JWTManager(app)

@app.route('/home')
def home():
    return jsonify({"message": "Welcome to the Chat App API!"})

@app.route('/history')
@jwt_required()
def get_history():
    try:
        current_user_id = get_jwt_identity()  # JWT에서 사용자 ID 추출
        print(f"Fetching data for user ID: {current_user_id}")  # 디버그 로그 추가
        user_data = get_user_data(current_user_id)
        if user_data:
            print(f"User found: {user_data['username']}")  # 디버그 로그 추가
            history = get_user_chat_historys(user_data['username'])
            print(f"Sending history data: {history}")  # 로그 추가
            return jsonify({"chat_history": history})
        else:
            print(f"User not found for ID: {current_user_id}")  # 디버그 로그 추가
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print(f"Error in get_history: {str(e)}")  # 에러 로그 추가
        print(f"Error type: {type(e).__name__}")  # 에러 타입 추가
        print(f"Error details: {e.args}")  # 에러 상세 정보 추가
        return jsonify({"error": "Internal server error"}), 500

@app.route('/history/<int:history_id>')
def get_chat(history_id):
    chat = get_user_chat(history_id)
    return jsonify({"chat": chat})

@app.route('/delete_chat/<int:history_id>', methods=['DELETE'])
def delete_chat_data(history_id):
    result = delete_chat(history_id)
    return jsonify({"success": result})

@app.route('/get_response', methods=['POST'])
@jwt_required()
def get_response():
    user_input = request.json.get("message")
    history_id = request.json.get("history_id")
    current_user_id = get_jwt_identity()  # JWT를 통해 사용자 ID 가져오기
    user = get_user_data(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    username = user['username']

    # AI로부터 유저 질문에 대한 답변을 받는 부분
    ai_response, user = get_ai_response(user_input, "")  # 채팅 히스토리 관리 필요

    if history_id:
        # 기존 대화 업데이트
        update_chat(int(history_id), user_input, ai_response)
    else:
        # 새 대화 시작
        history_id = add_chat(username, user_input, ai_response)
    
    return jsonify({
        "response": ai_response,
        "history_id": history_id
    })

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        user = create_user(username, email, password)
        if user:
            return jsonify({"success": True, "message": "User registered successfully"}), 201
        else:
            return jsonify({"success": False, "message": "Username or email already exists"}), 400
    except Exception as e:
        print(f"Error in register: {str(e)}")
        return jsonify({"error": "Registration failed"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({"success": False, "message": "Missing email or password"}), 400
        
        user = authenticate_user(email, password)
        if user:
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                "success": True, 
                "access_token": access_token,
                "user_id": str(user.id), 
                "username": user.username
            }), 200
        else:
            return jsonify({"success": False, "message": "Invalid email or password"}), 401
    except Exception as e:
        print(f"Error in login: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    return jsonify(logged_in_as=current_user_id), 200

@app.route('/user')
@jwt_required()
def get_user():
    try:
        current_user_id = get_jwt_identity()
        user = get_user_data(current_user_id)
        if user:
            return jsonify(user)
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        app.logger.error(f"Error in get_user: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    
@app.route('/delete_account', methods=['DELETE'])
@jwt_required()
def delete_account():
    try:
        current_user_id = get_jwt_identity()
        user = get_user_data(current_user_id)
        if user:
            success = delete_user(user['id'])
            if success:
                return jsonify({"success": True, "message": "User deleted successfully"}), 200
            else:
                return jsonify({"error": "Failed to delete user"}), 500
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        app.logger.error(f"Error in delete_account: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)