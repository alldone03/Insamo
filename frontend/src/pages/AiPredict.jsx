import React from 'react';
import { BrainCircuit, TrendingUp, AlertTriangle } from 'lucide-react';

const AiPredict = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Prediction Engine</h2>
        <div className="badge badge-primary gap-2 p-3">
          <BrainCircuit size={16} /> Model V.2.1 Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confidence Score */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h3 className="card-title">Confidence Score</h3>
            <div className="radial-progress text-primary font-bold text-xl my-4" style={{"--value":87, "--size": "8rem"}} role="progressbar">
              87.5%
            </div>
            <p className="opacity-70">Probability of event occurrence</p>
          </div>
        </div>

        {/* Summary */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title mb-4">Prediction Summary</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <tbody>
                  <tr>
                    <th>Predicted Event</th>
                    <td className="font-bold text-warning">High Rainfall</td>
                  </tr>
                  <tr>
                    <th>Time Horizon</th>
                    <td>Next 2 Hours</td>
                  </tr>
                  <tr>
                    <th>Recommendation</th>
                    <td>Prepare drainage pumps</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiPredict;