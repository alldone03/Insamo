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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="INSAMO LSTM Prediction Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


def classify_status(value: float, alert_th: float, danger_th: float) -> str:
    if value >= danger_th:
        return "DANGER"
    elif value >= alert_th:
        return "ALERT"
    return "NORMAL"


def build_lstm_model(lookback: int):
    """Build a simple LSTM model using raw TensorFlow/Keras."""
    import tensorflow as tf

    model = tf.keras.Sequential([
        tf.keras.layers.LSTM(64, activation='tanh', input_shape=(lookback, 1), return_sequences=True),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.LSTM(32, activation='tanh'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dense(1)
    ])
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss='mse')
    return model


def create_sequences(data: np.ndarray, lookback: int):
    """Create sliding window sequences for LSTM input."""
    X, y = [], []
    for i in range(lookback, len(data)):
        X.append(data[i - lookback:i, 0])
        y.append(data[i, 0])
    return np.array(X), np.array(y)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "insamo-lstm-prediction"}


@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    import tensorflow as tf

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
        std_val = 1.0  # prevent division by zero

    train_scaled = (train_raw - mean_val) / std_val
    test_scaled = (test_raw - mean_val) / std_val

    # Build full scaled series for sequence creation
    full_scaled = (data - mean_val) / std_val

    # Create training sequences
    train_data_for_seq = train_scaled.reshape(-1, 1)
    X_train, y_train = create_sequences(train_data_for_seq, lookback)
    X_train = X_train.reshape((X_train.shape[0], lookback, 1))

    logger.info(f"Training LSTM: {X_train.shape[0]} samples, {req.epochs} epochs, lookback={lookback}")

    # Build & train
    model = build_lstm_model(lookback)
    model.fit(X_train, y_train, epochs=req.epochs, batch_size=16, verbose=0)

    # === Evaluate on test set ===
    # Build test sequences from full data (need lookback window from train)
    full_for_test = full_scaled.reshape(-1, 1)
    X_test, y_test = create_sequences(
        full_for_test[train_size - lookback:],
        lookback
    )
    X_test = X_test.reshape((X_test.shape[0], lookback, 1))

    test_pred_scaled = model.predict(X_test, verbose=0).flatten()

    # Denormalize
    test_pred = test_pred_scaled * std_val + mean_val
    test_act = y_test * std_val + mean_val

    # Metrics
    rmse = float(np.sqrt(np.mean((test_act - test_pred) ** 2)))
    mae = float(np.mean(np.abs(test_act - test_pred)))
    non_zero = test_act != 0
    mape = float(np.mean(np.abs((test_act[non_zero] - test_pred[non_zero]) / test_act[non_zero])) * 100) if np.any(non_zero) else 0.0

    # === Future Prediction (predict_steps beyond last data) ===
    # Start from last lookback window of actual data
    last_window = full_scaled[-lookback:].reshape(1, lookback, 1)
    future_predictions = []

    current_window = last_window.copy()
    for step in range(predict_steps):
        pred_scaled = model.predict(current_window, verbose=0)[0, 0]
        pred_value = float(pred_scaled * std_val + mean_val)
        if pred_value < 0:
            pred_value = 0.0

        status = classify_status(pred_value, req.alert_threshold, req.danger_threshold)
        future_predictions.append(PredictionPoint(step=step + 1, value=round(pred_value, 4), status=status))

        # Slide window
        new_window = np.append(current_window[0, 1:, :], [[pred_scaled]], axis=0)
        current_window = new_window.reshape(1, lookback, 1)

    # Overall status
    peak = max(p.value for p in future_predictions)
    overall = classify_status(peak, req.alert_threshold, req.danger_threshold)

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