"""
INSAMO LSTM Water Level Prediction Microservice
================================================
FastAPI service yang menerima time-series water_level,
train LSTM model, dan return prediksi ke depan.

Endpoint:
  POST /predict
    Body: {
      "water_level": [120.0, 121.5, ...],     # minimal 100 data points
      "predict_steps": 50,                      # jumlah step prediksi
      "alert_threshold": 50.0,                  # cm
      "danger_threshold": 80.0                  # cm
    }
    
    Response: {
      "predictions": [{"step": 1, "value": 123.4, "status": "NORMAL"}, ...],
      "train_size": 100,
      "test_size": 50,
      "test_actual": [...],
      "test_predicted": [...],
      "metrics": {"rmse": 2.34, "mae": 1.89, "mape": 3.2},
      "scaling": {"mean": 120.5, "std": 15.3},
      "peak_predicted": 145.2,
      "overall_status": "NORMAL"
    }
"""

import logging
from typing import List
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- 1. Inisialisasi Logging & TensorFlow ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Validasi & Konfigurasi GPU (Dijalankan sekali saat startup)
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    logger.info(f"GPU Terdeteksi: {gpus}")
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        logger.error(f"Gagal mengatur memory growth: {e}")
else:
    logger.warning("GPU tidak terdeteksi, beralih menggunakan CPU.")

# --- 2. Inisialisasi FastAPI ---
app = FastAPI(title="INSAMO LSTM Prediction Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. Pydantic Models ---
class PredictionRequest(BaseModel):
    water_level: List[float]
    predict_steps: int = 50
    alert_threshold: float = 50.0
    danger_threshold: float = 80.0
    epochs: int = 50
    lookback: int = 10


class PredictionPoint(BaseModel):
    step: int
    value: float
    status: str  # NORMAL, ALERT, DANGER


class PredictionResponse(BaseModel):
    predictions: List[PredictionPoint]
    train_size: int
    test_size: int
    train_data: List[float]
    test_actual: List[float]
    test_predicted: List[float]
    metrics: dict
    scaling: dict
    peak_predicted: float
    overall_status: str


# --- 4. Helper Functions ---
def classify_status(value: float, alert_th: float, danger_th: float) -> str:
    if value >= danger_th:
        return "DANGER"
    elif value >= alert_th:
        return "ALERT"
    return "NORMAL"


def build_lstm_model(lookback: int):
    """Membangun model LSTM dengan dukungan GPU scope jika tersedia."""
    device_name = '/GPU:0' if gpus else '/CPU:0'

    print(device_name)
    
    with tf.device(device_name):
        model = tf.keras.Sequential([
            # Ciri cuDNN LSTM: activation='tanh', recurrent_activation='sigmoid'
            tf.keras.layers.LSTM(64, activation='tanh', input_shape=(lookback, 1), return_sequences=True),
            tf.keras.layers.Dropout(0.2),
            
            tf.keras.layers.LSTM(32, activation='tanh'),
            tf.keras.layers.Dropout(0.2),
            
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1)
        ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), 
            loss='mse'
        )
    return model


def create_sequences(data: np.ndarray, lookback: int):
    """Membuat sliding window sequences untuk input LSTM."""
    X, y = [], []
    for i in range(lookback, len(data)):
        X.append(data[i - lookback:i, 0])
        y.append(data[i, 0])
    return np.array(X), np.array(y)


# --- 5. Endpoints ---
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "insamo-lstm-prediction"}


@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    data = np.array(req.water_level, dtype=np.float64)
    total = len(data)
    predict_steps = req.predict_steps
    lookback = req.lookback

    if total < 100:
        raise HTTPException(status_code=400, detail=f"Minimal 100 data points, received {total}")

    # Split: gunakan semua kecuali predict_steps terakhir sebagai train
    train_size = total - predict_steps
    if train_size < lookback + 10:
        raise HTTPException(status_code=400, detail="Not enough training data after split")

    train_raw = data[:train_size]
    test_raw = data[train_size:]

    # Normalisasi (z-score scaling)
    mean_val = float(np.mean(train_raw))
    std_val = float(np.std(train_raw))
    if std_val == 0:
        std_val = 1.0  # mencegah pembagian dengan nol

    train_scaled = (train_raw - mean_val) / std_val
    full_scaled = (data - mean_val) / std_val

    # Buat training sequences
    train_data_for_seq = train_scaled.reshape(-1, 1)
    X_train, y_train = create_sequences(train_data_for_seq, lookback)
    X_train = X_train.reshape((X_train.shape[0], lookback, 1))

    logger.info(f"Training LSTM: {X_train.shape[0]} samples, {req.epochs} epochs, lookback={lookback}")

    # Inisialisasi & Training Model
    model = build_lstm_model(lookback)
    model.fit(X_train, y_train, epochs=req.epochs, batch_size=16, verbose=0)

    # === Evaluasi pada Test Set ===
    full_for_test = full_scaled.reshape(-1, 1)
    X_test, y_test = create_sequences(
        full_for_test[train_size - lookback:],
        lookback
    )
    X_test = X_test.reshape((X_test.shape[0], lookback, 1))

    test_pred_scaled = model.predict(X_test, verbose=0).flatten()

    # Denormalisasi data evaluasi
    test_pred = test_pred_scaled * std_val + mean_val
    test_act = y_test * std_val + mean_val

    # Kalkulasi Metrik Evaluasi
    rmse = float(np.sqrt(np.mean((test_act - test_pred) ** 2)))
    mae = float(np.mean(np.abs(test_act - test_pred)))
    non_zero = test_act != 0
    mape = float(np.mean(np.abs((test_act[non_zero] - test_pred[non_zero]) / test_act[non_zero])) * 100) if np.any(non_zero) else 0.0

    # === Prediksi Masa Depan (Autoregressive) ===
    last_window = full_scaled[-lookback:].reshape(1, lookback, 1)
    future_predictions = []
    current_window = last_window.copy()

    for step in range(predict_steps):
        pred_scaled = model.predict(current_window, verbose=0)[0, 0]
        pred_value = float(pred_scaled * std_val + mean_val)
        
        # Logika lantai bawah air (tidak mungkin minus)
        if pred_value < 0:
            pred_value = 0.0

        status = classify_status(pred_value, req.alert_threshold, req.danger_threshold)
        future_predictions.append(PredictionPoint(step=step + 1, value=round(pred_value, 4), status=status))

        # Geser sliding window (masukkan hasil prediksi terbaru ke dalam window input berikutnya)
        new_window = np.append(current_window[0, 1:, :], [[pred_scaled]], axis=0)
        current_window = new_window.reshape(1, lookback, 1)

    # Status keseluruhan berdasarkan nilai tertinggi hasil prediksi
    peak = max(p.value for p in future_predictions)
    overall = classify_status(peak, req.alert_threshold, req.danger_threshold)

    # Clear Keras session untuk mencegah memory leak
    tf.keras.backend.clear_session()

    return PredictionResponse(
        predictions=future_predictions,
        train_size=train_size,
        test_size=len(test_act),
        train_data=[round(float(v), 4) for v in train_raw],
        test_actual=[round(float(v), 4) for v in test_act],
        test_predicted=[round(float(v), 4) for v in test_pred],
        metrics={"rmse": round(rmse, 4), "mae": round(mae, 4), "mape": round(mape, 4)},
        scaling={"mean": round(mean_val, 4), "std": round(std_val, 4)},
        peak_predicted=round(peak, 4),
        overall_status=overall,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8501)