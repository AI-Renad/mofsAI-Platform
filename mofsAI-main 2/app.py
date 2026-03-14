import numpy as np
import sys
import os
import glob
from io import StringIO

# --- 1. حل مشكلة تعارض الإصدارات (Core Module Fix) ---
try:
    import numpy.core.multiarray
except ImportError:
    pass
sys.modules['core'] = np.core

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  # للسماح للواجهة Next.js بالاتصال بالسيرفر


# --- 2. البحث التلقائي عن ملف الموديل ---
def load_model():
    # يبحث عن أي ملف ينتهي بـ .pkl في المجلد الحالي
    pkl_files = glob.glob("*.pkl")
    if pkl_files:
        model_path = pkl_files[0]
        try:
            model = joblib.load(model_path)
            print(f"✅ Success: Loaded model from '{model_path}'")
            return model
        except Exception as e:
            print(f"❌ Error loading {model_path}: {e}")
            return None
    else:
        print("❌ Error: No .pkl model file found in the directory!")
        return None


model = load_model()


# --- 3. المسارات (Routes) ---

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "online",
        "message": "MOF Prediction API is running",
        "model_loaded": model is not None
    })


@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded on server. Check .pkl file.'}), 500

    try:
        data = request.get_json()
        if not data or 'csv_text' not in data:
            return jsonify({'error': 'No csv_text provided'}), 400

        # تحويل النص إلى DataFrame
        csv_data = StringIO(data['csv_text'])
        df = pd.read_csv(csv_data)

        # تنفيذ التوقع
        predictions = model.predict(df)

        # تجهيز النتائج وتنسيقها للرسوم البيانية
        results = []
        for i, score in enumerate(predictions):
            results.append({
                'id': i + 1,
                'name': f"Material-{i + 1}",
                'predicted_score': round(float(score), 4),
                'details': df.iloc[i].to_dict()
            })

        # ترتيب النتائج من الأفضل (الأعلى) إلى الأقل
        results = sorted(results, key=lambda x: x['predicted_score'], reverse=True)

        return jsonify({
            'status': 'success',
            'generated_materials': results[:15]  # نرسل أفضل 15 نتيجة للرسم البياني
        })

    except Exception as e:
        print(f"⚠️ Prediction Error: {e}")
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500


# --- 4. تشغيل السيرفر ---
if __name__ == '__main__':
    # PORT 10000 هو الافتراضي لـ Render
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)