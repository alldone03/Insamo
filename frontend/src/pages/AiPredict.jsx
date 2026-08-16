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
  Activity,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart, Area,
} from 'recharts';
import { api } from '../lib/api';
import InfoPopover from '../components/InfoPopover';

const AiPredict = () => {
  const [horizon, setHorizon] = useState('50');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [result, setResult] = useState(null);
  const [seismicData, setSeismicData] = useState(null);
  const [seismicHistory, setSeismicHistory] = useState([]);
  const [error, setError] = useState(null);

  // Ambang deteksi gempa dari firmware SIGMA (THRESHOLD_GAL di sigma_earthquake_sensor.ino)
  const SEISMIC_THRESHOLD_GAL = 3.0;

  const isSigma = selectedDevice?.device_type === 'SIGMA';

  // Fetch devices that support AI Predict (FLOWS = LSTM forecast, SIGMA = anomaly confidence)
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

  // Run LSTM water-level prediction (FLOWS devices only)
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

  // Check seismic anomaly confidence trend (SIGMA devices only)
  const runSeismicCheck = useCallback(async () => {
    if (!selectedDevice) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/sensor-readings', {
        params: { device_id: selectedDevice.id, per_page: 30 },
      });
      const readings = res.data?.data || [];
      const latest = readings[0];
      if (!latest) {
        setError('No sensor readings yet for this device');
        setSeismicData(null);
        setSeismicHistory([]);
      } else {
        setSeismicData({
          reading: latest,
          confidence: latest.classificationResults?.[0]?.confidence ?? null,
        });
        setSeismicHistory(
          [...readings].reverse().map((r) => ({
            time: r.recorded_at,
            pga_gal: r.pga_gal ?? 0,
            confidence_pct: r.classificationResults?.[0]?.confidence != null ? Math.round(r.classificationResults[0].confidence * 100) : null,
          }))
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch seismic data';
      setError(msg);
      setSeismicData(null);
      setSeismicHistory([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  const runCheck = isSigma ? runSeismicCheck : runPrediction;

  const getConfidenceLevel = (confidence) => {
    if (confidence == null) return { text: 'text-base-content', badge: 'badge-ghost', border: 'border-base-300', gradient: 'from-base-100 to-base-100', label: 'NO DATA' };
    if (confidence >= 0.7) return { text: 'text-error', badge: 'badge-error', border: 'border-error/40', gradient: 'from-error/10 to-base-100', label: 'HIGH ANOMALY' };
    if (confidence >= 0.4) return { text: 'text-warning', badge: 'badge-warning', border: 'border-warning/40', gradient: 'from-warning/10 to-base-100', label: 'MODERATE' };
    return { text: 'text-success', badge: 'badge-success', border: 'border-success/40', gradient: 'from-success/10 to-base-100', label: 'NORMAL PATTERN' };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'GEMPA':
        return { label: 'GEMPA', color: 'badge-error' };
      case 'CROSSCHECK':
        return { label: 'CROSSCHECK', color: 'badge-warning' };
      default:
        return { label: 'AMAN', color: 'badge-success' };
    }
  };

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
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-base-200 p-6 font-sans text-base-content">

      {/* Header */}
      <h2 className="text-4xl font-extrabold text-base-content mb-8">
        {isSigma ? 'AI Seismic Anomaly Monitor' : 'AI Water Level Predictive Monitor'}
      </h2>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
        {/* Device Dropdown */}
        <div className="dropdown dropdown-bottom">
          <div tabIndex={0} role="button" className="btn bg-[#1B75A7] hover:bg-[#155e8a] text-white border-none rounded-md px-6">
            {loadingDevices ? 'Loading...' : selectedDevice ? selectedDevice.name : 'Select Device'}
            <ChevronDown className="w-4 h-4 ml-2" />
          </div>
          <ul tabIndex={0} className="z-[50] menu dropdown-content bg-base-100 rounded-box w-72 max-w-[90vw] max-h-60 p-2 shadow-sm overflow-y-auto overflow-x-hidden block">
            {devices.map((d) => (
              <li key={d.id} className="w-full">
                <a onClick={() => { setSelectedDevice(d); setResult(null); setSeismicData(null); setError(null); }} className="flex items-center gap-2 w-full max-w-full">
                  <span className="truncate flex-1 min-w-0 block">{d.name} ({d.device_code})</span>
                  <span className={`badge badge-xs font-bold shrink-0 ${d.device_type === 'SIGMA' ? 'badge-error' : 'badge-info'}`}>{d.device_type}</span>
                </a>
              </li>
            ))}
            {devices.length === 0 && <li><a className="text-base-content/40">No predictable devices</a></li>}
          </ul>
        </div>



        {/* Predict Steps (LSTM only) */}
        {!isSigma && (
          <div className="flex items-center gap-4 text-sm font-semibold text-base-content/70 bg-base-100 px-4 py-2 rounded-lg shadow-sm">
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
        )}

        {/* Run Button */}
        <button
          className={`btn rounded-md px-6 border-none text-white ${loading ? 'bg-base-300' : 'bg-[#28a745] hover:bg-[#218838]'}`}
          onClick={runCheck}
          disabled={loading || !selectedDevice}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {isSigma ? 'Checking...' : 'Training LSTM...'}</>
          ) : (
            <><Brain className="w-4 h-4 mr-2" /> {isSigma ? 'Check Anomaly Status' : 'Run Prediction'}</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isSigma && (
      <>
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
              <h4 className="text-xs font-bold text-base-content/50 mb-1 uppercase tracking-wider">Predicted Next</h4>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-extrabold text-[#007bff]">{firstPred?.toFixed(2)} cm</span>
                {firstPred > lastActual ? <ArrowUp className="w-5 h-5 text-red-500" /> : <ArrowDown className="w-5 h-5 text-green-500" />}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-base-content/50 mb-1 uppercase tracking-wider">Last Actual</h4>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-extrabold text-[#007bff]">{lastActual?.toFixed(2)} cm</span>
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-base-content/50 mb-1 uppercase tracking-wider">Peak Predicted</h4>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-extrabold text-[#007bff]">{peakPred?.toFixed(2)} cm</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl justify-center">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-base-content/50 mb-2 uppercase tracking-wider">Alert Threshold</h4>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-[#d89f00]">{alertTh.toFixed(2)} cm</span>
                <Bell className="w-6 h-6 text-[#d89f00] fill-current" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl justify-center">
            <div className="card-body p-5">
              <h4 className="text-xs font-bold text-base-content/50 mb-2 uppercase tracking-wider">Danger Threshold</h4>
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
            <h3 className="text-lg font-bold text-base-content mb-4">
              Water Level — Train / Test / Prediction (cm)
            </h3>

            <div className="flex flex-wrap justify-center gap-6 mb-4 text-xs text-base-content/50">
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
                <div className="w-full h-full bg-base-200 rounded flex items-center justify-center border border-base-300">
                  <span className="text-base-content/40 font-medium">
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
            <h3 className="text-lg font-bold text-base-content mb-2">Prediction Insights</h3>
            {result ? (
              <>
                <p className="text-sm text-base-content/70 mb-4">
                  {result.overall_status === 'NORMAL'
                    ? `LSTM model predicts water level will remain stable. Peak at ${peakPred?.toFixed(2)} cm, below alert threshold (${alertTh} cm).`
                    : result.overall_status === 'ALERT'
                      ? `Warning: predicted peak ${peakPred?.toFixed(2)} cm exceeds alert threshold (${alertTh} cm). Monitor closely.`
                      : `DANGER: predicted peak ${peakPred?.toFixed(2)} cm exceeds danger threshold (${dangerTh} cm)! Immediate action required.`
                  }
                </p>

                <h4 className="font-bold text-base-content mb-1">Model Metrics:</h4>
                <div className="text-sm text-base-content/70 mb-4 space-y-1">
                  <p>RMSE: <span className="font-mono font-bold">{result.metrics.rmse}</span></p>
                  <p>MAE: <span className="font-mono font-bold">{result.metrics.mae}</span></p>
                  <p>MAPE: <span className="font-mono font-bold">{result.metrics.mape}%</span></p>
                </div>

                <h4 className="font-bold text-base-content mb-1">Scaling Parameters:</h4>
                <div className="text-sm text-base-content/70 mb-4 space-y-1">
                  <p>Mean: <span className="font-mono font-bold">{result.scaling.mean}</span></p>
                  <p>StdDev: <span className="font-mono font-bold">{result.scaling.std}</span></p>
                </div>

                <h4 className="font-bold text-base-content mb-1">Data Split:</h4>
                <div className="text-sm text-base-content/70 mb-6 space-y-1">
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
              <p className="text-sm text-base-content/40">
                Run a prediction to see model insights, metrics, and flood risk assessment.
              </p>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {isSigma && (
        <>
          {(() => {
            const confLevel = getConfidenceLevel(seismicData?.confidence);
            const confPercent = seismicData?.confidence != null ? Math.round(seismicData.confidence * 100) : 0;
            const reading = seismicData?.reading;
            const statusInfo = getStatusBadge(reading?.earthquake_status);
            return (
              <>
                {/* Confidence Banner */}
                <div className={`card shadow-md border bg-gradient-to-r ${confLevel.gradient} ${confLevel.border} mb-6`}>
                  <div className="card-body flex-row items-center gap-6 py-5">
                    {seismicData ? (
                      <div
                        className={`radial-progress ${confLevel.text} shrink-0`}
                        style={{ '--value': confPercent, '--size': '5.5rem', '--thickness': '7px' }}
                        role="progressbar"
                        aria-valuenow={confPercent}
                      >
                        <span className="text-xl font-black">{confPercent}%</span>
                      </div>
                    ) : (
                      <div className="radial-progress text-base-300 shrink-0" style={{ '--value': 0, '--size': '5.5rem', '--thickness': '7px' }}>
                        <span className="text-xs font-bold opacity-50">N/A</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Activity size={18} className={confLevel.text} />
                        <h3 className="font-black italic uppercase text-sm tracking-wide text-base-content">AI Anomaly Confidence</h3>
                        <span className={`badge badge-sm font-bold ${confLevel.badge}`}>{confLevel.label}</span>
                        <InfoPopover title="Apa itu AI Confidence?" align="dropdown-start">
                          <p>Skor statistik yang menunjukkan seberapa jauh PGA pembacaan ini menyimpang dari kebiasaan getaran normal alat ini sendiri.</p>
                          <p><strong>Cara hitung:</strong> ambil 30 pembacaan AMAN terakhir dari device ini → hitung rata-rata & standar deviasi PGA-nya (baseline) → hitung z-score PGA saat ini terhadap baseline → ubah jadi 0-100% lewat fungsi sigmoid.</p>
                          <p className="text-warning font-bold">Ini bukan prediksi kapan gempa terjadi — hanya skor anomali real-time, karena tidak ada dataset gempa asli berlabel untuk melatih model prediksi sungguhan.</p>
                        </InfoPopover>
                      </div>
                      <p className="text-xs text-base-content/50 leading-snug max-w-xl">
                        {seismicData
                          ? 'Seberapa jauh PGA pembacaan terakhir menyimpang dari baseline getaran normal perangkat ini. Ini skor anomali statistik real-time, bukan prediksi kapan gempa akan terjadi.'
                          : 'Klik "Check Anomaly Status" untuk mengambil pembacaan seismik terbaru dari perangkat ini.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seismic Stat Cards */}
                {seismicData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
                      <div className="card-body p-5">
                        <h4 className="text-xs font-bold text-base-content/50 mb-1 uppercase tracking-wider flex items-center gap-1">
                          Earthquake Status
                          <InfoPopover title="Earthquake Status">
                            <p>Status rule-based dari firmware alat (bukan AI), berdasarkan ambang PGA:</p>
                            <p><span className="badge badge-success badge-xs">AMAN</span> PGA di bawah {SEISMIC_THRESHOLD_GAL} Gal.</p>
                            <p><span className="badge badge-warning badge-xs">CROSSCHECK</span> PGA lewat ambang, sedang diverifikasi (minimal 3 osilasi dalam 500ms) supaya getaran sesaat (mis. pintu dibanting) tidak dianggap gempa.</p>
                            <p><span className="badge badge-error badge-xs">GEMPA</span> terkonfirmasi setelah cross-check terpenuhi.</p>
                          </InfoPopover>
                        </h4>
                        <span className={`badge font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                    </div>
                    <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
                      <div className="card-body p-5">
                        <h4 className="text-xs font-bold text-base-content/50 mb-1 uppercase tracking-wider flex items-center gap-1">
                          PGA
                          <InfoPopover title="PGA (Peak Ground Acceleration)">
                            <p>Percepatan getaran maksimum dalam satuan Gal (1 Gal = 1 cm/detik²), dibaca langsung dari akselerometer MPU6050.</p>
                            <p className="font-mono text-[10px] bg-base-200 rounded px-1 py-0.5">pga_gal = |resultan_akselerasi − gravitasi_baseline| × 100</p>
                          </InfoPopover>
                        </h4>
                        <span className="text-2xl font-extrabold text-[#007bff]">{reading?.pga_gal ?? '-'} Gal</span>
                      </div>
                    </div>
                    <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
                      <div className="card-body p-5">
                        <h4 className="text-xs font-bold text-base-content/50 mb-1 uppercase tracking-wider flex items-center gap-1">
                          Shindo (Intensity)
                          <InfoPopover title="Shindo">
                            <p>Skala intensitas gempa ala Jepang, dihitung dari PGA hanya saat status GEMPA terkonfirmasi.</p>
                            <p className="font-mono text-[10px] bg-base-200 rounded px-1 py-0.5">shindo = 2 × log10(PGA) + 0.94</p>
                          </InfoPopover>
                        </h4>
                        <span className="text-2xl font-extrabold text-[#007bff]">{reading?.shindo ?? '-'}</span>
                      </div>
                    </div>
                    <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
                      <div className="card-body p-5">
                        <h4 className="text-xs font-bold text-base-content/50 mb-1 uppercase tracking-wider">GPS Satellites</h4>
                        <span className="text-2xl font-extrabold text-[#007bff]">{reading?.satellite_count ?? '-'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PGA vs AI Confidence Trend */}
                {seismicHistory.length > 0 && (
                  <div className="card bg-base-100 shadow-md border-l-4 border-l-error rounded-xl mt-6">
                    <div className="card-body">
                      <h3 className="text-lg font-bold text-base-content mb-1 flex items-center gap-1.5">
                        Seismic Trend — PGA vs AI Confidence
                        <InfoPopover title="Cara Baca Chart Ini">
                          <p><span className="font-bold" style={{ color: '#007bff' }}>Garis biru (PGA)</span>: getaran mentah dari sensor, sumbu kiri, satuan Gal.</p>
                          <p><span className="font-bold" style={{ color: '#e83e8c' }}>Area merah muda (Confidence)</span>: skor anomali AI, sumbu kanan, satuan %.</p>
                          <p><span className="font-bold text-error">Garis putus-putus merah</span>: ambang deteksi gempa firmware ({SEISMIC_THRESHOLD_GAL} Gal) — bukan dari AI.</p>
                          <p>Data dari 30 pembacaan sensor_readings terakhir device ini, dipasangkan dengan confidence dari classification_results.</p>
                        </InfoPopover>
                      </h3>
                      <p className="text-xs text-base-content/50 mb-4">
                        {seismicHistory.length} pembacaan terakhir. Garis merah putus-putus adalah ambang deteksi gempa firmware ({SEISMIC_THRESHOLD_GAL} Gal).
                      </p>
                      <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={seismicHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey="time"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(timeStr) => {
                                if (!timeStr) return '';
                                const match = String(timeStr).match(/T(\d{2}):(\d{2})/);
                                return match ? `${match[1]}:${match[2]}` : timeStr;
                              }}
                            />
                            <YAxis yAxisId="pga" tick={{ fontSize: 11 }} label={{ value: 'PGA (Gal)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                            <YAxis yAxisId="conf" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Confidence %', angle: 90, position: 'insideRight', fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{ borderRadius: 8, fontSize: 12 }}
                              formatter={(val, name) => name === 'Confidence' ? [`${val}%`, name] : [`${Number(val).toFixed(2)} Gal`, name]}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <ReferenceLine yAxisId="pga" y={SEISMIC_THRESHOLD_GAL} stroke="#cc0000" strokeDasharray="6 3" label={{ value: `Ambang ${SEISMIC_THRESHOLD_GAL} Gal`, position: 'right', fontSize: 10, fill: '#cc0000' }} />
                            <Area yAxisId="conf" type="monotone" dataKey="confidence_pct" name="Confidence" fill="#e83e8c" stroke="#e83e8c" fillOpacity={0.15} connectNulls={false} />
                            <Line yAxisId="pga" type="monotone" dataKey="pga_gal" name="PGA (Gal)" stroke="#007bff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default AiPredict;