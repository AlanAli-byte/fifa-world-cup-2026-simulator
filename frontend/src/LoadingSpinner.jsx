import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const insights = [
  "Analyzing over 49,000 international football matches.",

  "Building team strength profiles from decades of international results.",

  "Training data spans multiple generations of international football.",

  "Historical matches are weighted by recency so recent performances matter more than games played years ago.",

  "Recent matches influence predictions more heavily than older results.",

  "Several forecasting approaches were evaluated during development.",

  "Logistic Regression was used as an early benchmark model.",

  "Gradient Boosting models were tested for match outcome prediction.",

  "Poisson goal models ultimately provided the strongest tournament simulation framework.",

  "The simulator predicts goals first, then derives win, draw, and loss probabilities from those goal distributions.",

  "Football matches are simulated using probabilistic goal distributions rather than fixed outcomes.",

  "Calculating attacking and defensive ratings for every nation in the dataset.",

  "Generating expected goals for every possible matchup.",

  "Expected goals are converted into exact scoreline probabilities before match resolution.",

  "Draw probabilities are derived mathematically from scoreline distributions rather than manually assigned.",

  "Model parameters were calibrated using historical international football results.",

  "A major challenge was preventing recent hot streaks from overpowering long-term team strength.",

  "Argentina initially dominated simulations unrealistically. Calibration experiments identified aggressive recency weighting as the cause.",

  "Several time-decay configurations were tested before selecting the production model.",

  "The current production engine uses an 8-year exponential decay window.",

  "An 8-year decay model significantly improved tournament calibration while maintaining predictive performance.",

  "Model calibration reduced unrealistic team dominance in tournament forecasts.",

  "Early versions required extensive recalibration before reaching production quality.",

  "Prediction quality was measured using both accuracy and log-loss on unseen historical matches.",

  "Accuracy alone is not enough — probability calibration is also measured.",

  "Validation was performed on unseen historical matches to reduce overfitting.",

  "The engine was validated on a strict holdout dataset before being used for tournament forecasting.",

  "The production model achieves approximately 61% accuracy on unseen international fixtures.",

  "Tournament forecasts are generated through Monte Carlo simulation rather than fixed bracket predictions.",

  "Every tournament run can produce a different champion due to randomness in match outcomes.",

  "Running 5,000 independent World Cup simulations...",

  "Each simulated World Cup includes group stages, knockout rounds, extra time, and penalty shootouts.",

  "Each tournament simulation contains more than 100 match forecasts.",

  "A full simulation evaluates hundreds of thousands of possible scorelines.",

  "Most computation time is spent generating and resolving complete tournament brackets.",

  "Knockout rounds require additional simulation for extra time and penalty shootouts.",

  "Probability estimates stabilize only after thousands of independent tournament simulations.",

  "Small probability events become meaningful when simulated thousands of times.",

  "Teams are not ranked directly — probabilities emerge from match-by-match simulation.",

  "Champion odds are calculated from aggregated results across all simulated tournaments.",

  "Computing qualification, semifinal, finalist, and championship probabilities for every nation.",

  "Processing qualification paths across all groups.",

  "Resolving knockout brackets across thousands of parallel football universes.",

  "Exploring thousands of alternative World Cup outcomes to estimate uncertainty.",

  "Aggregating finalist and champion frequencies across all simulations.",

  "Generating confidence estimates for every participating nation.",

  "Every percentage displayed is backed by thousands of simulated tournament outcomes.",

  "Preparing tournament probability distributions for visualization.",

  "Football remains highly unpredictable — probabilities are estimates, not guarantees.",

  "Preparing final World Cup forecasting dashboard..."
];

export default function LoadingSpinner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const MESSAGE_DURATION = 5000;
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, MESSAGE_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 w-full">
      
      <div className="relative flex items-center justify-center mb-10 mt-8">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 rounded-full border border-gray-300 scale-125 z-0" />
          <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.05, 0.2] }} transition={{ duration: 2, delay: 0.2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 rounded-full border border-gray-200 scale-150 z-0" />
          
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center rounded-full drop-shadow-xl z-10 bg-transparent">
              <img src="/ball.png" className="w-full h-full object-contain" alt="Ball" onError={(e) => { e.target.src = 'https://flagcdn.com/w160/un.png'; }} />
          </motion.div>
      </div>

      <div className="mt-8 flex flex-col items-center w-full max-w-md gap-4">
        
          <div className="min-h-[96px] flex items-center justify-center w-full px-4">          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-[15px] font-medium text-[#6B7280] text-center"
            >
              {insights[currentIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden mt-2">
            <motion.div initial={{ width: "0%" }} animate={{ width: "95%" }} transition={{ duration: 60, ease: "linear" }} className="h-full bg-[#2563EB]" />
        </div>
      </div>

    </div>
  );
}