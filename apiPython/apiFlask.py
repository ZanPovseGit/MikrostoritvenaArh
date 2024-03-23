from flask import Flask, jsonify, request
from pymongo import MongoClient
from bson import json_util
import json

app = Flask(__name__)

MONGO_URI = "mongodb+srv://zanpovse11:vajaPodat@pts.jyeuzzi.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sua"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

carts_collection = db['kosarica']

@app.route('/api/cart/<userId>', methods=['GET'])
def get_cart(userId):
    user_cart = carts_collection.find_one({'user': int(userId)})
    if user_cart:
        response_json = json_util.dumps(user_cart, default=json_util.default)
        return jsonify(json.loads(response_json))
    else:
        return jsonify({})

@app.route('/api/products', methods=['POST'])
def add_product():
    try:
        data = request.get_json()

        if 'id' not in data or 'products' not in data or 'user' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        result = carts_collection.insert_one(data)

        return jsonify({'inserted_id': str(result.inserted_id)}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#{
#    "id":1,
#    "products":[1,2],
#    "user":2
#}

@app.route('/api/cart/<userId>', methods=['PUT'])
def update_cart(userId):
    data = request.get_json()

    user_cart = carts_collection.find_one({'user': int(userId)})

    if 'id' not in data or 'products' not in data or 'user' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    if user_cart:
        carts_collection.update_one({'user': int(userId)}, {'$set': data})

        return jsonify({'message': 'Cart updated successfully.'})
    else:
        return jsonify({'error': 'User not found.'}), 404

@app.route('/api/cart/<userId>', methods=['DELETE'])
def remove_from_cart(userId):
    user_cart = carts_collection.find_one({'user': int(userId)})

    if user_cart:
        user_cart['products'] = [item for item in user_cart['products']]
        carts_collection.update_one({'user': int(userId)}, {'$unset': {'products': 1}})

        return jsonify({'message': 'Product removed from cart successfully.'})
    else:
        return jsonify({'error': 'User not found.'}), 404


@app.route('/api/cart/<userId>/checkout', methods=['POST'])
def checkout(userId):
    user_cart = carts_collection.find_one({'user': int(userId)})
    bla = []

    if user_cart:
        order_data = {'user': int(userId), 'products': user_cart['products']}
        create_order(order_data)

        carts_collection.update_one({'user': int(userId)}, {'$push': {'products': {'$each': bla}}})

        return jsonify({'message': 'Checkout successful. Order placed.'})
    else:
        return jsonify({'error': 'User not found.'}), 404

def create_order(order_data):
    print("Order created for user " + str(order_data['user']) + " with items: " + str(order_data['products']) )

@app.route('/api/cart/<userId>/add_products', methods=['PUT'])
def add_products_to_cart(userId):
    try:
        data = request.get_json()

        # Ensure the required fields are present
        if 'products' not in data:
            return jsonify({'error': 'Missing products field'}), 400

        # Find the existing document
        existing_cart = carts_collection.find_one({'user': int(userId)})

        if existing_cart:
            carts_collection.update_one({'user': int(userId)}, {'$push': {'products': {'$each': data['products']}}})

            return jsonify({'message': 'Products added to the cart successfully.'}), 200
        else:
            return jsonify({'error': 'User not found.'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=3002)