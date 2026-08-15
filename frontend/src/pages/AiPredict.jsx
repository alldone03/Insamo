import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  Bell,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  Loader2,
  Brain,
  BarChart3,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart,
} from 'recharts';
import { api } from '../lib/api';

const AiPredict = () => {
  const [horizon, setHorizon] = useState('50');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch FLOWS devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await api.get('/predict-devices');
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setDevices(data);
        if (data.length > 0) setSelectedDevice(data[0]);
      } catch (err) {
        console.error('Failed to fetch devices:', err);
      } finally {
        setLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  // Run prediction
  const runPrediction = useCallback(async () => {
    if (!selectedDevice) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/predict/${selectedDevice.id}`, {
        params: { predict_steps: Number(horizon) },
      });
      const data = res.data?.data || res.data;
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Prediction failed';
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, horizon]);

  // Build chart data
  const buildChartData = () => {
    if (!result) return [];
    const { train_data, test_actual, test_predicted, predictions } = result;
    const chartData = [];

    // Train data
    train_data.forEach((val, i) => {
      chartData.push({ index: i, actual: val, type: 'train' });
    });

    // Test: actual vs predicted
    test_actual.forEach((val, i) => {
      chartData.push({
        index: train_data.length + i,
        actual: val,
        predicted_test: test_predicted[i],
        type: 'test',
      });
    });

    // Future predictions
    predictions.forEach((p, i) => {
      chartData.push({
        index: train_data.length + test_actual.length + i,
        future: p.value,
        type: 'future',
      });
    });

    return chartData;
  };

  const chartData = buildChartData();
  const alertTh = result?.thresholds?.alert ?? 50;
  const dangerTh = result?.thresholds?.danger ?? 80;

  // Status config
  const getStatusConfig = (status) => {
    switch (status) {
      case 'DANGER':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle, label: 'DANGER' };
      case 'ALERT':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Bell, label: 'WARNING' };
      default:
        return { bg: 'bg-[#e6ffed]', text: 'text-[#008000]', border: 'border-green-200', icon: CheckCircle2, label: 'SAFE' };
    }
  };

  const statusConfig = result ? getStatusConfig(result.overall_status) : getStatusConfig('NORMAL');
  const StatusIcon = statusConfig.icon;

  const lastActual = result?.test_actual?.length > 0 ? result.test_actual[result.test_actual.length - 1] : null;
  const firstPred = result?.predictions?.length > 0 ? result.predictions[0].value : null;
  const peakPred = result?.peak_predicted ?? null;

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans text-base-content">

      {/* Header */}
      <h2 className="text-4xl font-extrabold text-gray-800 mb-8">
        AI Water Level Predictive Monitor
      </h2>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
        {/* Device Dropdown */}
        <div className="dropdown dropdown-bottom">
          <div tabIndex={0} role="button" className="btn bg-[#1B75A7] hover:bg-[#155e8a] text-white border-none rounded-md px-6">
            {loadingDevices ? 'Loading...' : selectedDevice ? selectedDevice.name : 'Select Device'}
            <ChevronDown className="w-4 h-4 ml-2" />
          </div>
          <ul tabIndex={0} className="z-[50] menu dropdown-content bg-base-100 rounded-box w-64 max-h-60 p-2 shadow-sm overflow-y-auto">
            {devices.map((d) => (
              <li key={d.id}>
                <a onClick={() => { setSelectedDevice(d); setResult(null); }}>
                  {d.name} ({d.device_code})
                </a>
              </li>
            ))}
            {devices.length === 0 && <li><a className="text-gray-400">No FLOWS devices</a></li>}
          </ul>
        </div>



        {/* Predict Steps */}
        <div className="flex items-center gap-4 text-sm font-semibold text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
          <span>Predict Steps:</span>
          {['25', '50', '75'].map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer hover:text-primary">
              <input
                type="radio"
                name="horizon"
                className="radio radio-primary radio-sm"
                value={val}
                checked={horizon === val}
                onChange={(e) => setHorizon(e.target.value)}
              />
              {val}
            </label>
          ))}
        </div>

        {/* Run Button */}
        <button
          className={`btn rounded-md px-6 border-none text-white ${loading ? 'bg-gray-400' : 'bg-[#28a745] hover:bg-[#218838]'}`}
          onClick={runPrediction}
          disabled={loading || !selectedDevice}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Training LSTM...</>
          ) : (
            <><Brain className="w-4 h-4 mr-2" /> Run Prediction</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Status Bar */}
      <div className={`${statusConfig.bg} ${statusConfig.text} p-5 rounded-xl flex flex-col md:flex-row items-center justify-between font-bold mb-6 shadow-sm border ${statusConfig.border}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className="w-6 h-6" fill="currentColor" stroke="white" />
          <span className="text-lg tracking-wide">
            {result
              ? `SYSTEM STATUS: ${statusConfig.label} — PEAK PREDICTED: ${peakPred?.toFixed(2)} cm`
              : 'SELECT DEVICE & RUN PREDICTION TO START'}
          </span>
        </div>
        {lastActual !== null && (
          <div className="mt-2 md:mt-0 text-lg">
            LATEST WATER LEVEL: {lastActual.toFixed(2)} cm
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-6">
          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Predicted Next</h4>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-extrabold text-[#007bff]">{firstPred?.toFixed(2)} cm</span>
                {firstPred > lastActual ? <ArrowUp className="w-5 h-5 text-red-500" /> : <ArrowDown className="w-5 h-5 text-green-500" />}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Last Actual</h4>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-extrabold text-[#007bff]">{lastActual?.toFixed(2)} cm</span>
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Peak Predicted</h4>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-extrabold text-[#007bff]">{peakPred?.toFixed(2)} cm</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl justify-center">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Alert Threshold</h4>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-[#d89f00]">{alertTh.toFixed(2)} cm</span>
                <Bell className="w-6 h-6 text-[#d89f00] fill-current" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl justify-center">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Danger Threshold</h4>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-[#cc0000]">{dangerTh.toFixed(2)} cm</span>
                <AlertTriangle className="w-6 h-6 text-[#cc0000] fill-current" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card bg-base-100 shadow-md border-l-4 border-l-[#007bff] rounded-xl">
          <div className="card-body">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Water Level — Train / Test / Prediction (cm)
            </h3>

            <div className="flex flex-wrap justify-center gap-6 mb-4 text-xs text-gray-500">
              <div className="flex items-center gap-2"><div className="w-8 h-1 bg-[#007bff]"></div> Actual</div>
              <div className="flex items-center gap-2"><div className="w-8 h-1 bg-[#e83e8c]"></div> Test (LSTM)</div>
              <div className="flex items-center gap-2"><div className="w-8 h-1 border-b-2 border-dashed border-[#ff8000]"></div> Future</div>
            </div>

            <div className="w-full h-80">
              {result ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="index"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val) => {
                        if (val === 0) return 'T1';
                        if (val === result.train_size) return 'Test';
                        if (val === result.train_size + result.test_size) return 'Pred';
                        return '';
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      formatter={(val) => [`${Number(val).toFixed(2)} cm`]}
                      labelFormatter={(idx) => {
                        if (idx < result.train_size) return `Train #${idx + 1}`;
                        if (idx < result.train_size + result.test_size) return `Test #${idx - result.train_size + 1}`;
                        return `Future #${idx - result.train_size - result.test_size + 1}`;
                      }}
                    />
                    <ReferenceLine y={alertTh} stroke="#d89f00" strokeDasharray="6 3" label={{ value: `Alert ${alertTh}`, position: 'right', fontSize: 10, fill: '#d89f00' }} />
                    <ReferenceLine y={dangerTh} stroke="#cc0000" strokeDasharray="6 3" label={{ value: `Danger ${dangerTh}`, position: 'right', fontSize: 10, fill: '#cc0000' }} />
                    <Line type="monotone" dataKey="actual" stroke="#007bff" dot={false} strokeWidth={1.5} name="Actual" connectNulls={false} />
                    <Line type="monotone" dataKey="predicted_test" stroke="#e83e8c" dot={false} strokeWidth={2} name="Test Predicted" connectNulls={false} />
                    <Line type="monotone" dataKey="future" stroke="#ff8000" strokeDasharray="5 3" dot={false} strokeWidth={2} name="Future" connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center border border-gray-100">
                  <span className="text-gray-400 font-medium">
                    {loading ? 'Training LSTM model...' : 'Select a device and run prediction'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card bg-base-100 shadow-md rounded-xl">
          <div className="card-body">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Prediction Insights</h3>
            {result ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  {result.overall_status === 'NORMAL'
                    ? `LSTM model predicts water level will remain stable. Peak at ${peakPred?.toFixed(2)} cm, below alert threshold (${alertTh} cm).`
                    : result.overall_status === 'ALERT'
                      ? `Warning: predicted peak ${peakPred?.toFixed(2)} cm exceeds alert threshold (${alertTh} cm). Monitor closely.`
                      : `DANGER: predicted peak ${peakPred?.toFixed(2)} cm exceeds danger threshold (${dangerTh} cm)! Immediate action required.`
                  }
                </p>

                <h4 className="font-bold text-gray-800 mb-1">Model Metrics:</h4>
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  <p>RMSE: <span className="font-mono font-bold">{result.metrics.rmse}</span></p>
                  <p>MAE: <span className="font-mono font-bold">{result.metrics.mae}</span></p>
                  <p>MAPE: <span className="font-mono font-bold">{result.metrics.mape}%</span></p>
                </div>

                <h4 className="font-bold text-gray-800 mb-1">Scaling Parameters:</h4>
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  <p>Mean: <span className="font-mono font-bold">{result.scaling.mean}</span></p>
                  <p>StdDev: <span className="font-mono font-bold">{result.scaling.std}</span></p>
                </div>

                <h4 className="font-bold text-gray-800 mb-1">Data Split:</h4>
                <div className="text-sm text-gray-600 mb-6 space-y-1">
                  <p>Train: <span className="font-mono font-bold">{result.train_size}</span> points</p>
                  <p>Test: <span className="font-mono font-bold">{result.test_size}</span> points</p>
                  <p>Predict: <span className="font-mono font-bold">{result.predictions.length}</span> steps</p>
                </div>

                <button
                  className={`btn w-full border-none rounded-lg font-bold tracking-wide mt-auto text-white ${result.overall_status === 'DANGER' ? 'bg-red-600 hover:bg-red-700'
                    : result.overall_status === 'ALERT' ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-[#28a745] hover:bg-[#218838]'
                    }`}
                >
                  {result.overall_status === 'DANGER' ? 'IMMEDIATE ACTION REQUIRED'
                    : result.overall_status === 'ALERT' ? 'MONITOR CLOSELY'
                      : 'NO ACTION REQUIRED'}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Run a prediction to see model insights, metrics, and flood risk assessment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiPredict;