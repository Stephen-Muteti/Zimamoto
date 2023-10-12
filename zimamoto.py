from flask import Flask, make_response, request, jsonify
import mysql.connector
from flask_cors import CORS
from flask_socketio import SocketIO
import math
from mysql.connector import OperationalError
import re
from mysql.connector import Error
import bcrypt
import calendar
import json
from datetime import datetime, timedelta
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
import requests
from math import radians, sin, cos, sqrt, atan2
from operator import itemgetter
import psycopg2

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'Team_leader_254'
expiration_time = timedelta(days=1)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = expiration_time
jwt = JWTManager(app)
CORS(app, origins='http://localhost:3000')
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins='http://localhost:3000')


connected_clients = set()


@socketio.on('connect')
def on_connect():
    print('New client connected')
    connected_clients.add(request.sid)



@socketio.on('disconnect')
def on_disconnect():
    print('Client disconnected')
    connected_clients.remove(request.sid)


def send_data_to_clients(data):
    socketio.emit('fire_update', data, namespace='/')

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'zimamoto'
}


def create_connection():
    connection = mysql.connector.connect(**db_config)
    return connection


def create_table(connection):
    cur = connection.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS fire_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255),
          phoneNumber VARCHAR(20),
          email VARCHAR(255),
          location_address TEXT,
          obtained_latitude FLOAT,
          obtained_longitude FLOAT,
          timeStamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    connection.commit()
    cur.close()


def calculate_distance(lat1, lon1, lat2, lon2):
    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    radius = 6371.0
    
    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = radius * c

    return distance


def get_report_brigades():
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()

            fetch_query = '''
                SELECT * FROM brigades
            '''

            cursor.execute(fetch_query)
            brigades = cursor.fetchall()

            cursor.close()
            connection.close()
            return brigades
    except OperationalError as op_err:
        print(f"Error connecting to the database: {op_err}")
    return []


@app.route('/')
def hello_world():
    return "Hello, World!"


@app.route('/update_fire_status', methods=['POST'])
@jwt_required()
def update_fire_status():
    try:
        operator = get_jwt_identity()
        operator_email = operator['email']
        if not (operator['role'] == 'operator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403

        data = request.get_json()
        fire_id = data.get('FireID')
        new_status = data.get('newStatus')

        if not fire_id or not new_status:
            return jsonify({'error': 'Missing required data in the request'}), 400

        connection = create_connection()
        if connection:

            cursor = connection.cursor()
            update_query = "UPDATE fire_assignments SET FireStatus = %s WHERE FireID = %s AND OperatorEmail = %s"

            cursor.execute(update_query, (new_status, fire_id, operator_email))

            connection.commit()

            if new_status == 'extinguished':
                update_brigade_availability(operator_email, 'Free') 

            return jsonify({'message': 'Fire status updated successfully'}), 200
        else:
            return jsonify({'error': 'Server is unreachable. Try again later'}), 500
    except Exception as e:
        return jsonify({'error': 'An error occurred while updating the fire status'}), 500
    

@app.route('/fetch_pending_tasks', methods=['GET'])
@jwt_required()
def fetch_pending_tasks():
    operator_email = get_jwt_identity()['email']

    connection = create_connection()
    if not connection:
        return jsonify({"message": "Server is unreachable. Try again later"}), 500

    cursor = connection.cursor()
    try:
        sql_query = """
            SELECT fa.FireID, fa.FireStatus, fr.location_address, fr.obtained_latitude, fr.obtained_longitude
            FROM fire_assignments fa
            JOIN fire_reports fr ON fa.FireID = fr.id
            WHERE fa.OperatorEmail = %s AND (fa.FireStatus = 'active' OR fa.FireStatus = 'responding')
            LIMIT 1
        """
        cursor.execute(sql_query, (operator_email,))
        result = cursor.fetchone()

        if result:
            fire_id, fire_status, location_address, obtained_latitude, obtained_longitude = result
            response_data = {
                "FireID": fire_id,
                "FireStatus": fire_status,
                "LocationAddress": location_address,
                "ObtainedLatitude": obtained_latitude,
                "ObtainedLongitude": obtained_longitude,
            }
            return jsonify(response_data)
        else:
            return jsonify({"message": "No pending tasks found for the operator"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()


def send_fire_assignment(brigade_operator, location_coordinates, location_address, last_inserted_id):
    socketio.emit('fire_assignment', {'operator_email' : brigade_operator, 'location_coordinates' : location_coordinates, 'location_address' : location_address, 'last_inserted_id' : last_inserted_id}, namespace='/')


def create_fire_assignments_table(connection):
    cursor = connection.cursor()
    query = """
    CREATE TABLE IF NOT EXISTS fire_assignments (
        FireID INT NOT NULL,
        OperatorEmail VARCHAR(255) NOT NULL,
        FireStatus VARCHAR(50) DEFAULT 'active',
        PRIMARY KEY (FireID, OperatorEmail),
        FOREIGN KEY (FireID) REFERENCES fire_reports(id),
        FOREIGN KEY (OperatorEmail) REFERENCES users(email) ON DELETE CASCADE
    )
    """
    cursor.execute(query)
    connection.commit()
    cursor.close()


@app.route('/zimamoto/report', methods=['POST'])
def receive_report():
    try:
        data = request.json
        name = data['name']
        phone_number = data['phone']
        email = data['email']
        obtained_latitude = data['latitude']
        obtained_longitude = data['longitude']

        if not name:
            return jsonify({'error': 'Please enter your name.'}), 400
        elif not phone_number:
            return jsonify({'error': 'Please enter your phone number.'}), 400
        elif not re.match(r'^0|254\d{9}$', phone_number):
            return jsonify({'error': 'Invalid phone number. Please enter a valid Kenyan phone number starting with 0 or 254.'}), 400
        elif obtained_latitude == 'unset' or obtained_longitude == 'unset':
            return jsonify({'error': 'We could not obtain your location coordinates. Please try again'}), 400

        location_address = get_location_address(obtained_latitude, obtained_longitude)
        
        if not location_address:
            return jsonify({'error': 'We could not obtain your location address. Please try again'}), 400


        connection = create_connection()

        if connection:
            brigades = get_report_brigades()
            distances = []
            for brigade in brigades:
                if brigade[6].lower().strip() == 'free':
                    print(brigade)
                    distance = calculate_distance(float(obtained_latitude), float(obtained_longitude), brigade[2], brigade[3])
                    distances.append((brigade, distance))
            
            distances.sort(key=itemgetter(1))

            location_coordinates = f'Lat: {obtained_latitude:.5f}, Lng: {obtained_longitude:.5f}'


            brigade_operator = ""
            brigade_id = None
            
            if distances:

                nearest_brigade, distance = distances[0]
                brigade_id = nearest_brigade[0]

                brigade_operator = nearest_brigade[1]

            create_table(connection)

            create_fire_assignments_table(connection)

            cur = connection.cursor()
            cur.execute('''
                INSERT INTO fire_reports (name, phoneNumber, email, location_address, obtained_latitude, obtained_longitude) 
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (name, phone_number, email, location_address, obtained_latitude, obtained_longitude))


            cur.execute("SELECT LAST_INSERT_ID()")
            last_inserted_id = cur.fetchone()[0]
            
            
            if brigade_operator:
                cur.execute('''
                    INSERT INTO fire_assignments (FireID, OperatorEmail, FireStatus) 
                    VALUES (%s, %s, %s)
                ''', (last_inserted_id, brigade_operator, 'active'))

                update_brigade_availability(brigade_operator, 'Engaged')                
                send_fire_assignment(brigade_operator, location_coordinates , location_address, last_inserted_id)
            
            connection.commit()
            cur.close()
            connection.close()

            location = ''

            if obtained_latitude != 'unset' and obtained_longitude != 'unset':
                location = f'{obtained_latitude:.3f}, {obtained_longitude:.3f}'
            else:
                location = user_entered_location_description

            data['location'] = location
            data['locationAddress'] = location_address

            current_date = datetime.now().strftime("%Y-%m-%d %H:%M")

            data['date'] = current_date

            send_data_to_clients(data)

            return jsonify({'message': 'The response team is on its way!'}), 200
        else:
            return jsonify({'error': 'Server is unreachable. Try again later'}), 500
    except OperationalError as op_err:
        return jsonify({'error': 'Server is unreachable. Try again later'}), 500
    except Exception as e:
        print(e)
        return jsonify({'error': f'An error occurred. We are fixing this soon'}), 500


def notify_brigade_availability(brigade_operator, new_availability):
    socketio.emit('brigade_availability_update', {'operatorEmail': brigade_operator, 'availability': new_availability.title()}, namespace='/')


def update_brigade_availability(brigade_operator, new_availability):
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()

            update_query = '''
                UPDATE brigades
                SET Availability = %s
                WHERE OperatorEmail = %s
            '''

            cursor.execute(update_query, (new_availability, brigade_operator))
            connection.commit()

            cursor.close()
            connection.close()
            notify_brigade_availability(brigade_operator, new_availability)
    except OperationalError as op_err:
        print(f"Error connecting to the database: {op_err}")
    except Exception as e:
        print(f"An error occurred while updating brigade availability: {e}")



def paginate_reports(page, limit, category):
    try:
        connection = create_connection()
        cur = connection.cursor()

        if category == 'today':
            # Fetch records for today only
            cur.execute('SELECT COUNT(*) FROM fire_reports WHERE DATE(timeStamp) = CURDATE()')
            total_reports = cur.fetchone()[0]
            total_pages = math.ceil(total_reports / limit)

            start_idx = (page - 1) * limit

            cur.execute(
                'SELECT name, phoneNumber, email, location_address, obtained_latitude, obtained_longitude, timeStamp FROM fire_reports WHERE DATE(timeStamp) = CURDATE() ORDER BY timeStamp DESC LIMIT %s OFFSET %s',
                (limit, start_idx)
            )
        elif category == 'this week':
            # Fetch records for the past 7 days (including today)
            cur.execute(
                'SELECT COUNT(*) FROM fire_reports WHERE DATE(timeStamp) BETWEEN CURDATE() - INTERVAL 6 DAY AND CURDATE()'
            )
            total_reports = cur.fetchone()[0]
            total_pages = math.ceil(total_reports / limit)

            start_idx = (page - 1) * limit

            cur.execute(
                'SELECT name, phoneNumber, email, location_address, obtained_latitude, obtained_longitude, timeStamp FROM fire_reports WHERE DATE(timeStamp) BETWEEN CURDATE() - INTERVAL 6 DAY AND CURDATE() ORDER BY timeStamp DESC LIMIT %s OFFSET %s',
                (limit, start_idx)
            )
        else:
            # Fetch all records
            cur.execute('SELECT COUNT(*) FROM fire_reports')
            total_reports = cur.fetchone()[0]
            total_pages = math.ceil(total_reports / limit)

            start_idx = (page - 1) * limit

            cur.execute(
                'SELECT name, phoneNumber, email, location_address, obtained_latitude, obtained_longitude, timeStamp FROM fire_reports ORDER BY timeStamp DESC LIMIT %s OFFSET %s',
                (limit, start_idx)
            )
        data = cur.fetchall()

        cur.close()
        connection.close()

        reports = []
        for report in data:
            name, phone_number, email, location_address, obtained_latitude, obtained_longitude, timeStamp = report
            location = ''

            location = f'{obtained_latitude:.3f}, {obtained_longitude:.3f}'

            reports.append({
                'name': name,
                'phone': phone_number,
                'location': location,
                'locationAddress': location_address,
                'date': timeStamp.strftime("%Y-%m-%d %H:%M")
            })

        return reports, total_pages
    except Exception as e:
        print("Error:", e)
        return [], 0
    finally:
        if connection:
            connection.close()

@app.route('/zimamoto/reports', methods=['GET'])
@jwt_required()
def get_reports():
    try:
        current_user = get_jwt_identity()
        role = current_user['role']
        email = current_user['email']
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 6))
        category = request.args.get('category', 'all')

        paginated_reports, total_pages = paginate_reports(page, limit, category)

        return jsonify({
            'data': paginated_reports,
            'total_pages': total_pages
        }), 200
    except Exception as e:
        print("Error:", e)
        return jsonify({'error': 'An error occurred. We are fixing this soon.'}), 500

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed

def is_phone_registered(connection, phone):
    try:
        cur = connection.cursor()
        cur.execute('SELECT phone FROM users WHERE phone = %s', (phone,))
        result = cur.fetchone()
        cur.close()
        return result is not None
    except Exception as e:
        print("Error:", e)
        return False


def is_email_registered(connection, email):
    try:
        cur = connection.cursor()
        cur.execute('SELECT email FROM users WHERE email = %s', (email,))
        result = cur.fetchone()
        cur.close()
        print(result)
        print(result is not None)
        return result is not None
    except Exception as e:
        print("Error:", e)
        return False

def isValidPassword(password):
    has_uppercase = any(char.isupper() for char in password)
    has_lowercase = any(char.islower() for char in password)
    has_digit = any(char.isdigit() for char in password)
    special_characters = '!@#$%^&*()_+[]:;<>,.?~/-'
    has_special_character = any(char in special_characters for char in password)
    is_min_length = len(password) >= 8
    return has_uppercase and has_lowercase and has_digit and has_special_character and is_min_length

def create_users_table(connection):
    try:
        cursor = connection.cursor()
        create_table_query = '''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                phone VARCHAR(15) NOT NULL,
                role VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        '''
        cursor.execute(create_table_query)
        connection.commit()
        print("Users table created")
    except Error as e:
        print(f"Error creating table: {e}")


def update_users_table(data):
    socketio.emit('update_users', data, namespace='/')

@app.route('/adduser', methods=['POST'])
@jwt_required()
def add_user():
    try:
        current_user = get_jwt_identity()        
        data = request.json
        name = data['name']
        email = data['email']
        phone = data['phone']
        role = data['role']
        password = data['password']

        if not (current_user['role'] == 'administrator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403
        
        if not name:
            return jsonify({'error': 'Please enter your name.'}), 400
        elif not email:
            return jsonify({'error': 'Please enter your email.'}), 400
        elif not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({'error': 'Invalid email address.'}), 400
        elif role == 'role':
            return jsonify({'error': 'Please select a role.'}), 400
        elif not phone:
            return jsonify({'error': 'Please enter your phone number.'}), 400
        elif not re.match(r'^0|254\d{9}$', phone):
            return jsonify({'error': 'Invalid phone number. Please enter a valid Kenyan phone number starting with 0 or 254.'}), 400
        elif not password:
            return jsonify({'error': 'Please enter a password.'}), 400
        elif len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long.'}), 400
        elif not isValidPassword(password):
            return jsonify({'error': 'Invalid password format.'}), 400

        connection = create_connection()
        if connection:
            create_users_table(connection)

            
            if is_email_registered(connection, email):
                connection.close()
                return jsonify({'error': 'Email already registered.'}), 409
            if is_phone_registered(connection, phone):
                connection.close()
                return jsonify({'error': 'Phone already registered.'}), 409
            
            hashed_password = hash_password(password)

            cursor = connection.cursor()
            insert_query = '''
                INSERT INTO users (name, email, phone, role, password)
                VALUES (%s, %s, %s, %s, %s)
            '''
            cursor.execute(insert_query, (name, email, phone, role, hashed_password))
            connection.commit()
            cursor.close()
            connection.close()
            update_users_table(data)
            return jsonify({'message': 'User added successfully!'}), 200
        else:
            return jsonify({'error': 'Database connection error.'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred. We are fixing this soon'}), 500


@app.route('/get_users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        connection = create_connection()
        cursor = connection.cursor(dictionary=True)

        # Get the 'category' query parameter, default to 'all' if not provided
        category = request.args.get('category', 'all')

        # Get the 'searchstring' query parameter, default to an empty string if not provided
        search_string = request.args.get('searchstring', '')

        page = int(request.args.get('page', 1))
        limit = 6  # Number of users per page

        # Calculate the start index based on the page number
        start_idx = (page - 1) * limit

        if category == 'all':
            # Fetch all users with pagination and search string filter
            cursor.execute(
                'SELECT id, name, email, phone, CONCAT(UCASE(LEFT(role, 1)), LCASE(SUBSTRING(role, 2))) AS role FROM users WHERE name LIKE %s OR email LIKE %s OR phone LIKE %s LIMIT %s OFFSET %s',
                (f'%{search_string}%', f'%{search_string}%', f'%{search_string}%', limit, start_idx))
        else:
            # Fetch users by category with pagination and search string filter
            cursor.execute(
                'SELECT id, name, email, phone, CONCAT(UCASE(LEFT(role, 1)), LCASE(SUBSTRING(role, 2))) AS role FROM users WHERE role = %s AND (name LIKE %s OR email LIKE %s OR phone LIKE %s) LIMIT %s OFFSET %s',
                (category, f'%{search_string}%', f'%{search_string}%', f'%{search_string}%', limit, start_idx))

        users = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(users), 200
    except Exception as e:
        return jsonify({'error': 'An error occurred. We are fixing this soon.'}), 500


@app.route('/get_user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    try:
        connection = create_connection()
        if connection:
            cur = connection.cursor(dictionary=True)
            cur.execute('SELECT name, email, phone, role FROM users WHERE id = %s', (user_id,))
            user_data = cur.fetchone()
            cur.close()
            connection.close()

            if user_data:
                return jsonify({'user': user_data}), 200
            else:
                return jsonify({'error': 'User not found'}), 200
        else:
            return jsonify({'error': 'Database connection error'}), 200
    except Exception as e:
        return jsonify({'error': 'An error occurred'}), 200

@app.route('/update_user/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        data = request.json
        name = data['name']
        email = data['email']
        phone = data['phone']
        role = data['role']

        current_user = get_jwt_identity()

        if not(current_user['role'] == 'administrator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403
        
        if not name:
            return jsonify({'error': 'Please enter your name.'}), 400
        elif not email:
            return jsonify({'error': 'Please enter your email.'}), 400
        elif role == 'role':
            return jsonify({'error': 'Please select a role.'}), 400            
        elif not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({'error': 'Invalid email address.'}), 400

        connection = create_connection()
        if connection:
            cur = connection.cursor()

            # Check if the user with the given user_id exists
            cur.execute('SELECT * FROM users WHERE id = %s', (user_id,))
            existing_user = cur.fetchone()

            if existing_user:
                # Check if the updated email already exists for another user
                cur.execute('SELECT id FROM users WHERE email = %s AND id != %s', (email, user_id))
                duplicate_email_user = cur.fetchone()
                cur.execute('SELECT id FROM users WHERE phone = %s AND id != %s', (phone, user_id))
                duplicate_phone_user = cur.fetchone()

                if duplicate_email_user:
                    cur.close()
                    connection.close()
                    return jsonify({'error': 'Email already registered for another user.'}), 409


                if duplicate_phone_user:
                    cur.close()
                    connection.close()
                    return jsonify({'error': 'Phone already registered for another user.'}), 409
                # Update user details
                cur.execute('UPDATE users SET name = %s, email = %s, phone = %s, role = %s WHERE id = %s', (name, email, phone, role, user_id))
                connection.commit()
                cur.close()
                connection.close()
                return jsonify({'message': 'User details updated successfully!'}), 200
            else:
                cur.close()
                connection.close()
                return jsonify({'error': 'User not found.'}), 404
        else:
            return jsonify({'error': 'Database connection error.'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred. We are fixing this soon'}), 500


@app.route('/deleteuser/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        current_user = get_jwt_identity()

        if not (current_user['role'] == 'administrator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403

        connection = create_connection()
        if connection:
            cur = connection.cursor()
            cur.execute('DELETE FROM users WHERE id = %s', (user_id,))
            connection.commit()
            cur.close()
            connection.close()
            return jsonify({'message': 'User deleted successfully!'}), 200
        else:
            return jsonify({'error': 'Database connection error.'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred. We are fixing this soon'}), 500

@app.route('/get_user_category_data', methods=['GET'])
@jwt_required()
def get_user_category_data():
    try:
        # Assuming you have a database connection and a users table
        connection = create_connection()
        if connection:
            cursor = connection.cursor()

            # Query to get the number of each user category
            query = '''
                SELECT
                    SUM(CASE WHEN role = 'Administrator' THEN 1 ELSE 0 END) AS administrators,
                    SUM(CASE WHEN role = 'Staff' THEN 1 ELSE 0 END) AS staff,
                    SUM(CASE WHEN role = 'Operator' THEN 1 ELSE 0 END) AS operators
                FROM users
            '''
            cursor.execute(query)
            result = cursor.fetchone()

            # Close the cursor and connection
            cursor.close()
            connection.close()

            # Create a dictionary with the data
            user_category_data = {
                'administrators': result[0],
                'staff': result[1],
                'operators': result[2]
            }

            return jsonify(user_category_data), 200
        else:
            return jsonify({'error': 'Database connection error.'}), 200
    except Exception as e:
        return jsonify({'error': 'An error occurred. We are fixing this soon.'}), 200

@app.route('/zimamoto/fire-reports', methods=['GET'])
@jwt_required()
def get_fire_reports():
    time_range = request.args.get('time_range')

    # Create a dictionary to store the aggregated data
    aggregated_data = {'labels': [], 'values': []}

    try:
        connection = create_connection()
        cursor = connection.cursor()

        if time_range == '1 year':
            cursor.execute("""
                SELECT
                    DATE_FORMAT(timeStamp, '%Y-%m') AS month,
                    COUNT(*) AS count
                FROM fire_reports
                WHERE timeStamp >= DATE_SUB(NOW(), INTERVAL 11 MONTH)
                GROUP BY month
                ORDER BY month
            """)
        elif time_range == '1 week':
            cursor.execute("""
                SELECT
                    DATE_FORMAT(timeStamp, '%Y-%m-%d') AS day,
                    COUNT(*) AS count
                FROM fire_reports
                WHERE timeStamp >= DATE_SUB(NOW(), INTERVAL 6 DAY)
                GROUP BY day
                ORDER BY day
            """)
        else:
            return jsonify({'error': 'Invalid time range'}), 400
        rows = cursor.fetchall()

        # Format the data into labels and values
        for row in rows:
            if time_range == '1 year':
                # For 1 year range, use month names as labels
                month_and_year = row[0]
                datetime_obj = datetime.strptime(month_and_year, "%Y-%m")
                formatted_label = datetime_obj.strftime("%B %Y")
                aggregated_data['labels'].append(formatted_label)
            elif time_range == '1 week':
                # For 1 week range, use day strings as labels
                day_string = row[0]
                datetime_obj = datetime.strptime(day_string, "%Y-%m-%d")
                formatted_label = datetime_obj.strftime("%A")
                aggregated_data['labels'].append(formatted_label)

            aggregated_data['values'].append(row[1])

        cursor.close()
        connection.close()

        return jsonify(aggregated_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_location_address(latitude, longitude):
    try:
        apiKey = 'cf2f14b5f24649798d81d0f437cdbebc'
        apiUrl = f'https://api.opencagedata.com/geocode/v1/json?q={latitude}+{longitude}&key={apiKey}'
        response = requests.get(apiUrl)
        data = response.json()
        formatted_address = data['results'][0]['formatted'] if data.get('results') else ''
        return formatted_address
    except Exception as e:
        print(f'Error getting location address: {e}')
        return ''


def create_brigades_table(connection):
    try:
        cursor = connection.cursor()
        create_table_query = """
            CREATE TABLE IF NOT EXISTS brigades (
                BrigadeID INT AUTO_INCREMENT PRIMARY KEY,
                OperatorEmail VARCHAR(255) NOT NULL,
                Latitude FLOAT DEFAULT 0.0,
                Longitude FLOAT DEFAULT 0.0,
                LocationAddress VARCHAR(255),  -- New column for location address
                Status VARCHAR(50) DEFAULT 'active',
                Availability VARCHAR(50) DEFAULT 'free',
                FOREIGN KEY (OperatorEmail) REFERENCES users(email) ON DELETE CASCADE
            )
        """
        cursor.execute(create_table_query)
        connection.commit()
        print("Brigades table created")
    except Error as e:
        print(f"Error creating table: {e}")

@app.route('/add_brigade', methods=['POST'])
@jwt_required()
def add_brigade():
    try:        
        data = request.json        
        operator_email = data['operatorEmail']
        status = data.get('Status', 'active')
        availability = data.get('Availability', 'free')        
        latitude = data.get('Latitude', 0.0)
        longitude = data.get('Longitude', 0.0)

        current_user = get_jwt_identity()
        if not (current_user['role'] == 'administrator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403

        location_address = get_location_address(latitude, longitude)       
        
        connection = create_connection()

        if connection:
            create_brigades_table(connection)            
            cursor = connection.cursor()            
            check_query = '''
                SELECT COUNT(*) FROM users WHERE email = %s AND role = 'operator'
            '''
            cursor.execute(check_query, (operator_email,))
            count = cursor.fetchone()[0]

            if count == 1:
                # Check if the operator already has a brigade
                brigade_check_query = '''
                    SELECT COUNT(*) FROM brigades WHERE OperatorEmail = %s
                '''
                cursor.execute(brigade_check_query, (operator_email,))
                brigade_count = cursor.fetchone()[0]

                if brigade_count == 0:
                    insert_query = '''
                        INSERT INTO brigades (OperatorEmail, latitude, longitude, LocationAddress, Status, Availability)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    '''
                    cursor.execute(insert_query, (operator_email, latitude, longitude, location_address, status, availability))

                    connection.commit()
                    cursor.close()
                    connection.close()

                    return jsonify({'message': 'Brigade added successfully'}), 200
                else:
                    # Operator already has a brigade
                    return jsonify({'error': 'Operator is already entitled to a brigade'}), 409
            else:
                # User with the provided email is not registered or not an operator
                return jsonify({'error': 'Operator with the provided email does not exist'}), 404
        else:
            return jsonify({'message': 'Connection to the server was unsuccessful'}), 500
    except Exception as e:
        return jsonify({'error': 'An error occurred. We are fixing this soon'}), 500

@app.route('/get_brigades', methods=['GET'])
@jwt_required()
def get_brigades():
    try:
        connection = create_connection()
        cursor = connection.cursor(dictionary=True)
        category = request.args.get('category', 'all')
        search_string = request.args.get('searchstring', '')

        page = int(request.args.get('page', 1))
        limit = 6

        start_idx = (page - 1) * limit

        if category == 'all':
            # Fetch all brigades with pagination and search string filter
            cursor.execute(
                'SELECT BrigadeID, OperatorEmail, Latitude, Longitude, LocationAddress, Status, Availability FROM brigades WHERE OperatorEmail LIKE %s OR Status LIKE %s OR Availability LIKE %s LIMIT %s OFFSET %s',
                (f'%{search_string}%', f'%{search_string}%', f'%{search_string}%', limit, start_idx))
        else:
            cursor.execute(
                'SELECT BrigadeID, OperatorEmail, Latitude, Longitude, LocationAddress, Status, Availability FROM brigades WHERE (Status = %s OR Availability = %s) AND (OperatorEmail LIKE %s OR Status LIKE %s OR Availability LIKE %s) LIMIT %s OFFSET %s',
                (category, category, f'%{search_string}%', f'%{search_string}%', f'%{search_string}%', limit, start_idx))

        brigades = cursor.fetchall()

        cursor.close()
        connection.close()

        final_brigades = []

        for brigade in brigades:
            BrigadeID = brigade['BrigadeID']
            OperatorEmail = brigade['OperatorEmail']
            Latitude = brigade['Latitude']
            Longitude = brigade['Longitude']
            LocationAddress = brigade['LocationAddress']
            Status = brigade['Status'].title()
            Availability = brigade['Availability'].title()
            Location = ''
            try:
                Latitude = float(Latitude)
                Longitude = float(Longitude)
                Location = f'{Latitude:.2f}, {Longitude:.2f}'
            except ValueError as e:
                location = 'Invalid location'

            final_brigades.append({
                'BrigadeID': BrigadeID,
                'OperatorEmail': OperatorEmail,
                'Location': Location,
                'LocationAddress': LocationAddress,
                'Status': Status,
                'Availability': Availability
            })


        return jsonify(final_brigades), 200
    except Exception as e:
        return jsonify({'error': 'An error occurred. We are fixing this soon.'}), 500


@app.route('/deletebrigade/<int:brigade_id>', methods=['DELETE'])
@jwt_required()
def delete_brigade(brigade_id):
    try:
        connection = create_connection()
        current_user = get_jwt_identity()

        if not (current_user['role'] == 'administrator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403

        if connection:
            cur = connection.cursor()
            cur.execute('DELETE FROM brigades WHERE BrigadeID = %s', (brigade_id,))
            connection.commit()
            cur.close()
            connection.close()
            return jsonify({'message': 'Brigade deleted successfully!'}), 200
        else:
            return jsonify({'error': 'Database connection error.'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred. We are fixing this soon'}), 500


@app.route('/get_brigade/<int:brigade_id>', methods=['GET'])
@jwt_required()
def get_brigade(brigade_id):
    try:
        connection = create_connection()
        if connection:
            cur = connection.cursor(dictionary=True)
            cur.execute('SELECT OperatorEmail, Latitude, Longitude, Status, Availability FROM brigades WHERE BrigadeID = %s', (brigade_id,))
            brigade_data = cur.fetchone()
            cur.close()
            connection.close()

            if brigade_data:
                return jsonify({'brigade': brigade_data}), 200
            else:
                return jsonify({'error': 'Brigade not found'}), 200
        else:
            return jsonify({'error': 'Database connection error'}), 200
    except Exception as e:
        return jsonify({'error': 'An error occurred'}), 200


@app.route('/zimamoto/update_brigade/<int:brigade_id>', methods=['PUT'])
@jwt_required()
def update_brigade(brigade_id):
    try:
        data = request.get_json()

        operator_email = data['OperatorEmail']
        latitude = data['Latitude']
        longitude = data['Longitude']
        status = data['Status']
        availability = data['Availability']

        current_user = get_jwt_identity()
        if not(current_user['role'] == 'administrator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403

        connection = create_connection()
        if connection:
            cur = connection.cursor()
            check_query = '''
                SELECT COUNT(*) FROM users WHERE email = %s AND role = 'operator'
            '''
            cur.execute(check_query, (operator_email,))
            count = cur.fetchone()[0]

            if count == 1:
                cur.execute('SELECT * FROM brigades WHERE BrigadeID = %s', (brigade_id,))
                existing_brigade = cur.fetchone()

                if existing_brigade:
                    cur.execute('SELECT BrigadeID FROM brigades WHERE OperatorEmail = %s AND BrigadeID != %s', (operator_email, brigade_id))
                    duplicate_email_brigade = cur.fetchone()

                    if duplicate_email_brigade:
                        cur.close()
                        connection.close()
                        return jsonify({'error': 'Operator is already assigned to a brigade.'}), 409

                    
                    cur.execute('UPDATE brigades SET OperatorEmail = %s, Latitude = %s, Longitude = %s, Status = %s, Availability = %s WHERE BrigadeID = %s', (operator_email, latitude, longitude, status, availability, brigade_id))
                    connection.commit()
                    cur.close()
                    connection.close()
                    return jsonify({'message': 'Brigade details updated successfully!'}), 200
                else:
                    cur.close()
                    connection.close()
                    return jsonify({'error': 'Brigade not found.'}), 404
            else:
                return jsonify({'error': 'Operator with the provided email does not exist'}), 404
        else:
            return jsonify({'error': 'Database connection error.'}), 500
    except Exception as e:
        return jsonify({'error': 'An error occurred. We are fixing this soon'}), 500


@app.route('/get_brigade_categories', methods=['GET'])
@jwt_required()
def get_brigade_categories():
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()
            query = '''
                SELECT
                    SUM(CASE WHEN Status = 'active' THEN 1 ELSE 0 END) AS active,
                    SUM(CASE WHEN Status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
                    SUM(CASE WHEN Availability = 'under maintenance' THEN 1 ELSE 0 END) AS maintenance,
                    SUM(CASE WHEN Availability = 'engaged' THEN 1 ELSE 0 END) AS engaged,
                    SUM(CASE WHEN Availability = 'free' THEN 1 ELSE 0 END) AS free,
                    COUNT(*) AS total
                FROM brigades
            '''

            cursor.execute(query)
            result = cursor.fetchone()
            cursor.close()
            connection.close()
            brigade_category_data = {
                'active': result[0],
                'inactive': result[1],
                'maintenance': result[2],
                'engaged': result[3],
                'free': result[4],
                'total': result[5]
            }

            return jsonify(brigade_category_data), 200
        else:
            return jsonify({'error': 'Database connection error.'}), 500
    except Exception as e:
        return jsonify({'error': 'An error occurred. We are fixing this soon.'}), 500


@app.route('/validate_session', methods=['GET'])
@jwt_required()
def validate_session():
    try:
        current_user = get_jwt_identity()
        return jsonify({'user': current_user}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'User not found'}), 401



def check_user_credentials(email, password):
    connection = create_connection()
    
    if connection:
        cursor = connection.cursor()
        check_query = '''
            SELECT email, role, password FROM users WHERE email = %s
        '''
        cursor.execute(check_query, (email,))
        user_data = cursor.fetchone()
        cursor.close()
        connection.close()

        if user_data and bcrypt.checkpw(password.encode('utf-8'), user_data[2].encode('utf-8')):
            return {'email': user_data[0], 'role': user_data[1]}

    return None


@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Invalid input data'}), 400

        user_data = check_user_credentials(email, password)

        if user_data:
            access_token = create_access_token(identity=user_data)

            response_data = {
                'user': user_data,
                'token': access_token,
                'message': 'Login successful'
            }

            response = make_response(jsonify(response_data))

            # Calculate the expiration time, e.g., 1 day from the current time
            expiration_time = datetime.utcnow() + timedelta(days=1)

            return response, 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401
    except Exception as e:
        print(e)
        return jsonify({'error': 'An error occurred'}), 500


@app.route('/updateLocation',methods=['POST'])
@jwt_required()
def update_location():
    try:
        current_user_email = get_jwt_identity()['email']

        data = request.json
        location_coordinates = data.get('coordinates')
        location_address = data.get('address')

        if location_coordinates:
            latitude = location_coordinates.get('latitude', 0.0)
            longitude = location_coordinates.get('longitude', 0.0)

            connection = create_connection()
            if connection:
                cursor = connection.cursor()

                # Update the brigade's location where OperatorEmail matches the authenticated user's email
                update_query = """
                    UPDATE brigades
                    SET Latitude = %s, Longitude = %s, LocationAddress = %s
                    WHERE OperatorEmail = %s
                """
                cursor.execute(update_query, (latitude, longitude, location_address, current_user_email))
                connection.commit()

                cursor.close()
                connection.close()

                return jsonify({'message': 'Location updated successfully'}), 200
            else:
                return jsonify({'error': 'Database connection error'}), 500
        else:
            return jsonify({'error': 'Location is null'}), 500
    except Exception as e:
        return jsonify({'error': 'An error occurred while updating location'}), 500


@app.route('/update_availability', methods=['POST'])
@jwt_required()
def update_availability():
    try:
        current_user = get_jwt_identity()
        data = request.json
        availability = data.get('availability')
        user_email = current_user['email']

        if not(current_user['role'] == 'operator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403

        connection = create_connection()

        if connection:
            cursor = connection.cursor()

            update_query = '''
                UPDATE brigades
                SET Availability = %s
                WHERE OperatorEmail = %s
            '''

            cursor.execute(update_query, (availability, user_email))
            connection.commit()

            cursor.close()
            connection.close()
            notify_brigade_availability(user_email, availability)
            return jsonify({'message': 'Availability updated successfully'}), 200
        else:
            return jsonify({'error': 'Database connection error'}), 500            
    except Exception as e:
        return jsonify({'error': 'An error occurred while updating location'}), 500


@app.route('/get_operator_availability', methods=['GET'])
@jwt_required()
def get_operator_availability():
    try:
        current_user = get_jwt_identity()
        user_email = current_user['email']
        
        if not (current_user['role'] == 'operator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403
        
        connection = create_connection()

        if connection:
            cursor = connection.cursor()

            fetch_query = '''
                SELECT Availability FROM brigades WHERE OperatorEmail = %s
            '''

            cursor.execute(fetch_query, (user_email,))
            availability = cursor.fetchone()

            if availability:
                return jsonify({'availability': availability[0].title()}), 200
            else:
                return jsonify({'error': 'Availability not found'}), 404
        else:
            return jsonify({'error': 'Connection to the server was unsuccessful'}), 500
    except Exception as e:
        return jsonify({'error': 'An error occurred. We are fixing this soon'}), 500



def update_brigade_state(active_change, inactive_change):
    socketio.emit('brigade_state_update', {'activeChange': active_change, 'inactiveChange': inactive_change}, namespace='/')


def update_brigade_status(operator_email, new_status):
    socketio.emit('brigade_status_update', {'operatorEmail': operator_email, 'status': new_status.title()}, namespace='/')


@app.route('/update_operator_status', methods=['PUT'])
@jwt_required()
def update_operator_status():
    try:
        current_user= get_jwt_identity()
        current_user_email = current_user['email']
        data = request.json
        status = data.get('status', 'active')
        
        if not (current_user['role'] == 'operator'):
            return jsonify({'error': 'You cannot perform this action.'}), 403


        connection = create_connection()

        if connection:
            cursor = connection.cursor()

            update_query = '''
                UPDATE brigades
                SET Status = %s
                WHERE OperatorEmail = %s
            '''

            cursor.execute(update_query, (status, current_user_email))
            connection.commit()

            cursor.close()
            connection.close()

            update_brigade_status(current_user_email, status)

            if status == 'active':
                update_brigade_state(1, -1)
            else:
                update_brigade_state(-1, 1)                
        return jsonify({'message': 'Operator status updated successfully'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'An error occurred while updating operator status'}), 500



if __name__ == '__main__':

    socketio.run(app, debug=True)